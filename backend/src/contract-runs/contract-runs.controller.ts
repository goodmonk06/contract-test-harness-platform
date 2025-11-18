import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContractRunsService } from './contract-runs.service';
import { ExecuteRunDto } from './dto';

@ApiTags('contract-runs')
@Controller('contract-runs')
export class ContractRunsController {
  constructor(private readonly contractRunsService: ContractRunsService) {}

  @Post('execute')
  @ApiOperation({ summary: 'Execute a contract test run' })
  execute(@Body() executeRunDto: ExecuteRunDto) {
    return this.contractRunsService.executeRun(executeRunDto.suiteId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contract runs' })
  findAll(@Query('suiteId') suiteId?: string) {
    return this.contractRunsService.findAll(suiteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contract run by ID' })
  findOne(@Param('id') id: string) {
    return this.contractRunsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contract run' })
  remove(@Param('id') id: string) {
    return this.contractRunsService.remove(id);
  }
}
