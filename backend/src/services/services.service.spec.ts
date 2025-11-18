import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';

describe('ServicesService', () => {
  let service: ServicesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    service: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockService = {
    id: 'test-id-123',
    name: 'Test API',
    baseUrl: 'https://api.test.com',
    description: 'Test description',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of services', async () => {
      const mockServices = [mockService];
      mockPrismaService.service.findMany.mockResolvedValue(mockServices);

      const result = await service.findAll();

      expect(result).toEqual(mockServices);
      expect(mockPrismaService.service.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              apiSpecs: true,
              contractSuites: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a service if found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const result = await service.findOne('test-id-123');

      expect(result).toEqual(mockService);
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id-123' },
        include: {
          apiSpecs: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          contractSuites: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const createDto: CreateServiceDto = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
        description: 'Test description',
      };

      mockPrismaService.service.create.mockResolvedValue(mockService);

      const result = await service.create(createDto);

      expect(result).toEqual(mockService);
      expect(mockPrismaService.service.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      const updateDto: UpdateServiceDto = {
        name: 'Updated API',
      };

      const updatedService = { ...mockService, ...updateDto };
      mockPrismaService.service.update.mockResolvedValue(updatedService);

      const result = await service.update('test-id-123', updateDto);

      expect(result).toEqual(updatedService);
      expect(mockPrismaService.service.update).toHaveBeenCalledWith({
        where: { id: 'test-id-123' },
        data: updateDto,
      });
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.service.update.mockRejectedValue(new Error());

      await expect(
        service.update('non-existent-id', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a service', async () => {
      mockPrismaService.service.delete.mockResolvedValue(mockService);

      const result = await service.remove('test-id-123');

      expect(result).toEqual(mockService);
      expect(mockPrismaService.service.delete).toHaveBeenCalledWith({
        where: { id: 'test-id-123' },
      });
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.service.delete.mockRejectedValue(new Error());

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
