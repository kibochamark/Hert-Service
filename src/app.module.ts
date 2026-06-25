import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CompanyModule } from './domains/company/company.module';
import { S3Module } from './globalservices/s3/s3.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './domains/users/users.module';
import { ContributionModule } from './domains/contribution/contribution.module';
import { InvestmentModule } from './domains/investment/investment.module';
import { FinancialTransactionsModule } from './domains/financial-transactions/financial-transactions.module';
import { BullModule } from '@nestjs/bullmq';
import { JOB_NAMES, QUEUE_NAMES } from './lib/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
        isGlobal: true,
      },

    ),  
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'redis-service',
        port: parseInt(process.env.REDIS_PORT as string) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: 1000,
        removeOnFail: 2000,
      },
    }),
    PrismaModule,
    CompanyModule,
    S3Module,
    UsersModule,
    ContributionModule,
    InvestmentModule,
    FinancialTransactionsModule
  ],
})
export class AppModule {}
