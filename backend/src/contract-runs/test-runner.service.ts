import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export interface TestResult {
  success: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
    tests?: any[];
  };
  logPath: string;
}

@Injectable()
export class TestRunnerService {
  private readonly logsDir = join(process.cwd(), 'test-logs');

  async runTests(testFilePath: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Run tests using Jest
      const { stdout, stderr } = await execAsync(
        `npx jest ${testFilePath} --json --testLocationInResults`,
        {
          cwd: process.cwd(),
          env: { ...process.env, NODE_ENV: 'test' },
        },
      );

      const duration = Date.now() - startTime;

      // Parse Jest output
      let jestResult;
      try {
        jestResult = JSON.parse(stdout);
      } catch (e) {
        // If JSON parsing fails, create a basic result
        jestResult = {
          success: false,
          numTotalTests: 0,
          numPassedTests: 0,
          numFailedTests: 0,
          testResults: [],
        };
      }

      // Save logs
      const logPath = await this.saveLogs(testFilePath, stdout, stderr);

      return {
        success: jestResult.success || false,
        summary: {
          total: jestResult.numTotalTests || 0,
          passed: jestResult.numPassedTests || 0,
          failed: jestResult.numFailedTests || 0,
          duration,
          tests: jestResult.testResults || [],
        },
        logPath,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Jest exits with non-zero code on test failures
      // Try to parse the error output
      let summary = {
        total: 0,
        passed: 0,
        failed: 0,
        duration,
        error: error.message,
      };

      if (error.stdout) {
        try {
          const jestResult = JSON.parse(error.stdout);
          summary = {
            total: jestResult.numTotalTests || 0,
            passed: jestResult.numPassedTests || 0,
            failed: jestResult.numFailedTests || 0,
            duration,
            tests: jestResult.testResults || [],
          };
        } catch (e) {
          // Keep default summary
        }
      }

      const logPath = await this.saveLogs(
        testFilePath,
        error.stdout || '',
        error.stderr || error.message,
      );

      return {
        success: false,
        summary,
        logPath,
      };
    }
  }

  private async saveLogs(
    testFilePath: string,
    stdout: string,
    stderr: string,
  ): Promise<string> {
    const { mkdirSync } = require('fs');
    mkdirSync(this.logsDir, { recursive: true });

    const timestamp = Date.now();
    const fileName = `test-run-${timestamp}.log`;
    const logPath = join(this.logsDir, fileName);

    const logContent = `
Test File: ${testFilePath}
Timestamp: ${new Date().toISOString()}

=== STDOUT ===
${stdout}

=== STDERR ===
${stderr}
    `.trim();

    writeFileSync(logPath, logContent, 'utf-8');

    return logPath;
  }
}
