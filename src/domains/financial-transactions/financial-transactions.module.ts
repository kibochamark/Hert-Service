import { Module } from '@nestjs/common';
import { FinancialTransactionsService } from './financial-transactions.service';
import { FinancialTransactionsRepository } from './financial-transactions.repository';
import { FinancialTransactionsController } from './controllers/financial-transactions.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [FinancialTransactionsController],
  providers: [FinancialTransactionsService, FinancialTransactionsRepository],
  exports: [FinancialTransactionsService], // Export if other modules might need to inject it
})
export class FinancialTransactionsModule {}
