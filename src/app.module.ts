import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CompanyModule } from './domains/company/company.module';
import { S3Module } from './globalservices/s3/s3.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './domains/users/users.module';
import { ContributionModule } from './domains/contribution/contribution.module';
import { InvestmentModule } from './domains/investment/investment.module';
import { FinancialTransactionsModule } from './domains/financial-transactions/financial-transactions.module';
import { BullModule } from '@nestjs/bullmq';
import { JOB_NAMES, QUEUE_NAMES } from './lib/constants';
import { APP_GUARD } from '@nestjs/core';

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
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,      // 1 second
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,     // 1 minute
        limit: 100,
      },
      {
        name: 'long',
        ttl: 3600000,   // 1 hour
        limit: 1000,
      },
    ]),

    

    PrismaModule,
    CompanyModule,
    S3Module,
    UsersModule,
    ContributionModule,
    InvestmentModule,
    FinancialTransactionsModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },  
  ],
})
export class AppModule {}
