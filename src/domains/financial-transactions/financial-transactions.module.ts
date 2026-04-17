import { Module } from '@nestjs/common';
import { FinancialTransactionsService } from './financial-transactions.service';
import { FinancialTransactionsRepository } from './financial-transactions.repository';
import { FinancialTransactionsController } from '../../controllers/financial-transactions.controller';
import { PortfolioController } from '../../controllers/portfolio.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [FinancialTransactionsController, PortfolioController],
  providers: [FinancialTransactionsService, FinancialTransactionsRepository],
  exports: [FinancialTransactionsService],
})
export class FinancialTransactionsModule {}
