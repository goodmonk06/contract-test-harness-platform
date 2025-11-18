import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiSpecDto } from './dto';
import { OpenApiParserService } from './openapi-parser.service';

@Injectable()
export class ApiSpecsService {
  constructor(
    private prisma: PrismaService,
    private openApiParser: OpenApiParserService,
  ) {}

  async findAll(serviceId?: string) {
    return this.prisma.apiSpec.findMany({
      where: serviceId ? { serviceId } : undefined,
      include: {
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const spec = await this.prisma.apiSpec.findUnique({
      where: { id },
      include: {
        service: true,
      },
    });

    if (!spec) {
      throw new NotFoundException(`API Spec with ID ${id} not found`);
    }

    return spec;
  }

  async create(createApiSpecDto: CreateApiSpecDto) {
    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: createApiSpecDto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${createApiSpecDto.serviceId} not found`);
    }

    // Validate OpenAPI spec
    try {
      await this.openApiParser.validate(createApiSpecDto.rawText, createApiSpecDto.format);
    } catch (error) {
      throw new BadRequestException(`Invalid OpenAPI spec: ${error.message}`);
    }

    return this.prisma.apiSpec.create({
      data: createApiSpecDto,
      include: {
        service: true,
      },
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.apiSpec.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`API Spec with ID ${id} not found`);
    }
  }

  async parseSpec(id: string) {
    const spec = await this.findOne(id);
    return this.openApiParser.parse(spec.rawText, spec.format);
  }
}
