import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractSuiteDto, UpdateContractSuiteDto } from './dto';
import { TestGeneratorService } from './test-generator.service';
import { ApiSpecsService } from '../api-specs/api-specs.service';

@Injectable()
export class ContractSuitesService {
  constructor(
    private prisma: PrismaService,
    private testGenerator: TestGeneratorService,
    private apiSpecsService: ApiSpecsService,
  ) {}

  async findAll(serviceId?: string) {
    return this.prisma.contractSuite.findMany({
      where: serviceId ? { serviceId } : undefined,
      include: {
        service: true,
        _count: {
          select: {
            runs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const suite = await this.prisma.contractSuite.findUnique({
      where: { id },
      include: {
        service: true,
        runs: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!suite) {
      throw new NotFoundException(`Contract Suite with ID ${id} not found`);
    }

    return suite;
  }

  async create(createContractSuiteDto: CreateContractSuiteDto) {
    const service = await this.prisma.service.findUnique({
      where: { id: createContractSuiteDto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${createContractSuiteDto.serviceId} not found`);
    }

    return this.prisma.contractSuite.create({
      data: createContractSuiteDto,
      include: {
        service: true,
      },
    });
  }

  async update(id: string, updateContractSuiteDto: UpdateContractSuiteDto) {
    try {
      return await this.prisma.contractSuite.update({
        where: { id },
        data: updateContractSuiteDto,
      });
    } catch (error) {
      throw new NotFoundException(`Contract Suite with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.contractSuite.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Contract Suite with ID ${id} not found`);
    }
  }

  async generateFromSpec(serviceId: string, apiSpecId: string, suiteName?: string) {
    // Get the service
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    // Parse the API spec
    const parsedSpec = await this.apiSpecsService.parseSpec(apiSpecId);

    // Generate test file
    const testFilePath = await this.testGenerator.generateTestFile(
      service,
      parsedSpec,
    );

    // Create contract suite
    const suite = await this.create({
      serviceId,
      name: suiteName || `Auto-generated from ${parsedSpec.info.title}`,
      description: `Generated from OpenAPI spec version ${parsedSpec.info.version}`,
      configJson: JSON.stringify({
        apiSpecId,
        testFilePath,
        generatedAt: new Date().toISOString(),
        endpointCount: parsedSpec.endpoints.length,
      }),
    });

    return {
      ...suite,
      testFilePath,
    };
  }
}
