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
import { ApiSpecsService } from './api-specs.service';
import { CreateApiSpecDto } from './dto';

@ApiTags('api-specs')
@Controller('api-specs')
export class ApiSpecsController {
  constructor(private readonly apiSpecsService: ApiSpecsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a new API spec' })
  create(@Body() createApiSpecDto: CreateApiSpecDto) {
    return this.apiSpecsService.create(createApiSpecDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API specs, optionally filtered by service' })
  findAll(@Query('serviceId') serviceId?: string) {
    return this.apiSpecsService.findAll(serviceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an API spec by ID' })
  findOne(@Param('id') id: string) {
    return this.apiSpecsService.findOne(id);
  }

  @Get(':id/parsed')
  @ApiOperation({ summary: 'Get parsed OpenAPI spec' })
  parseSpec(@Param('id') id: string) {
    return this.apiSpecsService.parseSpec(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API spec' })
  remove(@Param('id') id: string) {
    return this.apiSpecsService.remove(id);
  }
}
