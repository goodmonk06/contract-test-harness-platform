import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'User API' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://api.example.com' })
  @IsUrl()
  @IsNotEmpty()
  baseUrl: string;

  @ApiProperty({ example: 'REST API for user management', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
