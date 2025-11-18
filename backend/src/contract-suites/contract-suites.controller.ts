import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContractSuitesService } from './contract-suites.service';
import { CreateContractSuiteDto, UpdateContractSuiteDto, GenerateSuiteDto } from './dto';

@ApiTags('contract-suites')
@Controller('contract-suites')
export class ContractSuitesController {
  constructor(private readonly contractSuitesService: ContractSuitesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contract suite' })
  create(@Body() createContractSuiteDto: CreateContractSuiteDto) {
    return this.contractSuitesService.create(createContractSuiteDto);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a contract suite from an API spec' })
  generate(@Body() generateSuiteDto: GenerateSuiteDto) {
    return this.contractSuitesService.generateFromSpec(
      generateSuiteDto.serviceId,
      generateSuiteDto.apiSpecId,
      generateSuiteDto.suiteName,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all contract suites' })
  findAll(@Query('serviceId') serviceId?: string) {
    return this.contractSuitesService.findAll(serviceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contract suite by ID' })
  findOne(@Param('id') id: string) {
    return this.contractSuitesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contract suite' })
  update(
    @Param('id') id: string,
    @Body() updateContractSuiteDto: UpdateContractSuiteDto,
  ) {
    return this.contractSuitesService.update(id, updateContractSuiteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contract suite' })
  remove(@Param('id') id: string) {
    return this.contractSuitesService.remove(id);
  }
}
