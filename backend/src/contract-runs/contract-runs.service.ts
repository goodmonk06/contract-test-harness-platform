import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestRunnerService } from './test-runner.service';

@Injectable()
export class ContractRunsService {
  constructor(
    private prisma: PrismaService,
    private testRunner: TestRunnerService,
  ) {}

  async findAll(suiteId?: string) {
    return this.prisma.contractRun.findMany({
      where: suiteId ? { suiteId } : undefined,
      include: {
        suite: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const run = await this.prisma.contractRun.findUnique({
      where: { id },
      include: {
        suite: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Contract Run with ID ${id} not found`);
    }

    return run;
  }

  async executeRun(suiteId: string) {
    // Get the suite
    const suite = await this.prisma.contractSuite.findUnique({
      where: { id: suiteId },
      include: {
        service: true,
      },
    });

    if (!suite) {
      throw new NotFoundException(`Contract Suite with ID ${suiteId} not found`);
    }

    // Parse config to get test file path
    const config = JSON.parse(suite.configJson);
    const testFilePath = config.testFilePath;

    if (!testFilePath) {
      throw new NotFoundException('Test file path not found in suite config');
    }

    // Create a new run record
    const run = await this.prisma.contractRun.create({
      data: {
        suiteId,
        startedAt: new Date(),
        status: 'RUNNING',
      },
    });

    // Execute tests asynchronously
    this.runTestsAsync(run.id, testFilePath);

    return run;
  }

  private async runTestsAsync(runId: string, testFilePath: string) {
    try {
      const result = await this.testRunner.runTests(testFilePath);

      await this.prisma.contractRun.update({
        where: { id: runId },
        data: {
          finishedAt: new Date(),
          status: result.success ? 'PASSED' : 'FAILED',
          summaryJson: JSON.stringify(result.summary),
          logPath: result.logPath,
        },
      });
    } catch (error) {
      await this.prisma.contractRun.update({
        where: { id: runId },
        data: {
          finishedAt: new Date(),
          status: 'ERROR',
          summaryJson: JSON.stringify({
            error: error.message,
            stack: error.stack,
          }),
        },
      });
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.contractRun.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Contract Run with ID ${id} not found`);
    }
  }
}
