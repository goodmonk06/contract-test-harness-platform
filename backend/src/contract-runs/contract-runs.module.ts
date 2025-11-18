import { Module } from '@nestjs/common';
import { ContractRunsController } from './contract-runs.controller';
import { ContractRunsService } from './contract-runs.service';
import { TestRunnerService } from './test-runner.service';

@Module({
  controllers: [ContractRunsController],
  providers: [ContractRunsService, TestRunnerService],
  exports: [ContractRunsService],
})
export class ContractRunsModule {}
