import { Module } from '@nestjs/common';
import { ContractSuitesController } from './contract-suites.controller';
import { ContractSuitesService } from './contract-suites.service';
import { TestGeneratorService } from './test-generator.service';
import { ApiSpecsModule } from '../api-specs/api-specs.module';

@Module({
  imports: [ApiSpecsModule],
  controllers: [ContractSuitesController],
  providers: [ContractSuitesService, TestGeneratorService],
  exports: [ContractSuitesService],
})
export class ContractSuitesModule {}
