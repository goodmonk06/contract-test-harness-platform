import { Module } from '@nestjs/common';
import { ApiSpecsController } from './api-specs.controller';
import { ApiSpecsService } from './api-specs.service';
import { OpenApiParserService } from './openapi-parser.service';

@Module({
  controllers: [ApiSpecsController],
  providers: [ApiSpecsService, OpenApiParserService],
  exports: [ApiSpecsService, OpenApiParserService],
})
export class ApiSpecsModule {}
