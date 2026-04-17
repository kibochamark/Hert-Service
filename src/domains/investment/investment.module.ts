import { Module } from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { InvestmentRepository } from './investment.repository';
import { InvestmentController } from './controllers/investment.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [InvestmentController],
  providers: [InvestmentService, InvestmentRepository],
  exports: [InvestmentService],
})
export class InvestmentModule {}
