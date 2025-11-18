import { PartialType } from '@nestjs/swagger';
import { CreateContractSuiteDto } from './create-contract-suite.dto';

export class UpdateContractSuiteDto extends PartialType(CreateContractSuiteDto) {}
