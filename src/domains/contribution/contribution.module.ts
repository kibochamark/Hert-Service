import { Module } from '@nestjs/common';
import { ContributionService } from './contribution.service';
import { ContributionRepository } from './contribution.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ContributionController } from 'src/controllers/contribution.controller';
import { S3Service } from 'src/globalservices/s3/s3.service';
import { S3Module } from 'src/globalservices/s3/s3.module';
import { FinancialTransactionsModule } from '../financial-transactions/financial-transactions.module';
import { BullModule } from '@nestjs/bullmq';
import { ContributionProcessor } from './contribution.processor';
import { RedismoduleModule } from '../redismodule/redismodule.module';

@Module({
  imports: [
    
    BullModule.registerQueue({
      name: 'process-contribution-job',
    }),

    PrismaModule, LedgerModule, S3Module, FinancialTransactionsModule, RedismoduleModule],
  providers: [ContributionService, ContributionRepository, ContributionProcessor],
  controllers:[ContributionController],
  exports: [ContributionService, ContributionRepository, BullModule] // Export ContributionService and ContributionRepository if they're used by other modules
})
export class ContributionModule {}
