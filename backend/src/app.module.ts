import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';
import { ApiSpecsModule } from './api-specs/api-specs.module';
import { ContractSuitesModule } from './contract-suites/contract-suites.module';
import { ContractRunsModule } from './contract-runs/contract-runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ServicesModule,
    ApiSpecsModule,
    ContractSuitesModule,
    ContractRunsModule,
  ],
})
export class AppModule {}
