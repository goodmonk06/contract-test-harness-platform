import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSuiteDto {
  @ApiProperty({ example: 'clxxx123' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: 'clxxx456' })
  @IsString()
  @IsNotEmpty()
  apiSpecId: string;

  @ApiProperty({ example: 'My Contract Suite', required: false })
  @IsString()
  @IsOptional()
  suiteName?: string;
}
