import { Module } from '@nestjs/common';
import { ContributionService } from './contribution.service';
import { ContributionRepository } from './contribution.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ContributionController } from 'src/controllers/contribution.controller';
import { S3Service } from 'src/globalservices/s3/s3.service';
import { S3Module } from 'src/globalservices/s3/s3.module';

@Module({
  imports: [PrismaModule, LedgerModule, S3Module],
  providers: [ContributionService, ContributionRepository],
  controllers:[ContributionController],
  exports: [ContributionService, ContributionRepository] // Export ContributionService and ContributionRepository if they're used by other modules
})
export class ContributionModule {}
