import { Injectable, Logger } from '@nestjs/common';
import { FinancialTransactionsRepository } from './financial-transactions.repository';
import { AccountType } from 'generated/prisma/enums';
import { LedgerService } from '../../domains/ledger/ledger.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinancialTransactionsService {
  private logger = new Logger(FinancialTransactionsService.name);

  constructor(
    private readonly financialTransactionsRepository: FinancialTransactionsRepository,
    private readonly ledgerService: LedgerService,
    private readonly prisma: PrismaService,
  ) {}

  private async getOrCreateAccount(companyId: string, type: AccountType, name: string) {
    let account = await this.prisma.memberAccount.findFirst({
      where: { companyId, type },
    });

    if (!account) {
      account = await this.prisma.memberAccount.create({
        data: { name, type, companyId },
      });
      this.logger.log(`Created ${type} account: ${account.id} for company: ${companyId}`);
    }

    return account;
  }

  async logRevenue(
    data: { amount: number; dateReceived: Date; investmentId: string },
    companyId: string,
    userId: string,
  ) {
    try {
      this.logger.log(`Logging revenue of ${data.amount} for company ${companyId}`);

      // 1. Create ReturnRecord
      const returnRecord = await this.financialTransactionsRepository.createReturnRecord({
        amount: data.amount,
        dateReceived: data.dateReceived,
        investment: { connect: { id: data.investmentId } },
      });

      // 2. Find required accounts
      const assetAccount = await this.prisma.memberAccount.findFirst({
        where: { companyId, type: AccountType.ASSET },
      });

      if (!assetAccount) {
        throw new Error(`ASSET account not found for company: ${companyId}`);
      }

      const revenueAccount = await this.getOrCreateAccount(companyId, AccountType.REVENUE, 'Revenue Account');

      // 3. Transfer: debit ASSET (cash comes in), credit REVENUE
      // Revenue increases when credited; ASSET increases when debited
      await this.ledgerService.executeTransfer({
        debitAccountId: assetAccount.id,
        creditAccountId: revenueAccount.id,
        amount: data.amount,
        description: `Investment return received (ReturnRecord: ${returnRecord.id})`,
        userId,
        companyId,
        referenceId: returnRecord.id,
      });

      this.logger.log(`Revenue logged for company ${companyId}, ReturnRecord: ${returnRecord.id}`);
      return returnRecord;
    } catch (error) {
      this.logger.error(`Error logging revenue: ${(error as Error).message}`);
      throw error;
    }
  }

  async logExpense(
    data: { amount: number; description: string; transactionDate: Date },
    companyId: string,
    userId: string,
  ) {
    try {
      this.logger.log(`Logging expense of ${data.amount} for company ${companyId}`);

      // 1. Find required accounts
      const assetAccount = await this.prisma.memberAccount.findFirst({
        where: { companyId, type: AccountType.ASSET },
      });

      if (!assetAccount) {
        throw new Error(`ASSET account not found for company: ${companyId}`);
      }

      const expenseAccount = await this.getOrCreateAccount(companyId, AccountType.EXPENSE, 'Expense Account');

      // 2. Transfer: debit EXPENSE (expense increases), credit ASSET (cash goes out)
      const ledgerEntry = await this.ledgerService.executeTransfer({
        debitAccountId: expenseAccount.id,
        creditAccountId: assetAccount.id,
        amount: data.amount,
        description: data.description,
        userId,
        companyId,
      });

      this.logger.log(`Expense logged for company ${companyId}`);
      return ledgerEntry;
    } catch (error) {
      this.logger.error(`Error logging expense: ${(error as Error).message}`);
      throw error;
    }
  }

  async getRevenue(companyId: string) {
    return this.financialTransactionsRepository.findReturnRecordsByCompany(companyId);
  }

  async getExpenses(companyId: string) {
    return this.financialTransactionsRepository.findExpensesByCompany(companyId);
  }

  async getCompanyBalance(companyId: string) {
    return this.financialTransactionsRepository.getCompanyBalance(companyId);
  }

  async getPortfolioSummary(companyId: string) {
    return this.financialTransactionsRepository.getPortfolioSummary(companyId);
  }
}
