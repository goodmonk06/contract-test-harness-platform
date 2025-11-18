import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractSuiteDto {
  @ApiProperty({ example: 'clxxx123' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: 'User API Contract Tests' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Tests for all GET endpoints', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '{}' })
  @IsString()
  @IsNotEmpty()
  configJson: string;
}
