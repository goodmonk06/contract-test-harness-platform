import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SpecFormat {
  OPENAPI_JSON = 'OPENAPI_JSON',
  OPENAPI_YAML = 'OPENAPI_YAML',
}

export class CreateApiSpecDto {
  @ApiProperty({ example: 'clxxx123' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: '1.0.0' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ enum: SpecFormat, example: SpecFormat.OPENAPI_JSON })
  @IsEnum(SpecFormat)
  format: string;

  @ApiProperty({ example: '{"openapi": "3.0.0", ...}' })
  @IsString()
  @IsNotEmpty()
  rawText: string;
}
