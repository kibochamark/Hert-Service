import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

      if (assetAccount.balance.toNumber() < data.amount) {
        throw new BadRequestException(
          `Insufficient funds: company balance is ${assetAccount.balance}, cannot expense ${data.amount}`,
        );
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


  async deleteExpense(ledgerEntryId: string, companyId: string, userId: string) {
    try {
      this.logger.log(`Reversing expense ledger entry ${ledgerEntryId} for company ${companyId}`);

      // 1. Look up the company's expense and asset accounts by companyId
      const [expenseAccount, assetAccount] = await Promise.all([
        this.prisma.memberAccount.findFirst({ where: { companyId, type: AccountType.EXPENSE } }),
        this.prisma.memberAccount.findFirst({ where: { companyId, type: AccountType.ASSET } }),
      ]);

      if (!expenseAccount) throw new Error(`EXPENSE account not found for company: ${companyId}`);
      if (!assetAccount) throw new Error(`ASSET account not found for company: ${companyId}`);

      // 2. Find the specific ledger entry scoped to this company's expense account
      const original = await this.prisma.ledgerEntry.findFirst({
        where: {
          id: ledgerEntryId,
          debitAccountId: expenseAccount.id,
          creditAccountId: assetAccount.id,
        },
      });

      if (!original) {
        throw new Error(`Expense entry ${ledgerEntryId} not found for company ${companyId}`);
      }

      // 3. Reverse: swap debit/credit (debit ASSET, credit EXPENSE)
      // Original: debit EXPENSE, credit ASSET  →  Reversal: debit ASSET, credit EXPENSE
      const reversal = await this.ledgerService.executeTransfer({
        debitAccountId: assetAccount.id,
        creditAccountId: expenseAccount.id,
        amount: Number(original.amount),
        description: `Reversal of expense: ${original.description}`,
        userId,
        companyId,
        referenceId: original.id,
      });

      this.logger.log(`Expense entry ${ledgerEntryId} reversed via entry ${reversal.id}`);
      return reversal;
    } catch (error) {
      this.logger.error(`Error reversing expense: ${(error as Error).message}`);
      throw error;
    }
  }

  async deposit(
    data: { amount: number; description?: string },
    companyId: string,
    userId: string,
  ) {
    try {
      this.logger.log(`Depositing ${data.amount} into asset account for company ${companyId}`);

      const assetAccount = await this.prisma.memberAccount.findFirst({
        where: { companyId, type: AccountType.ASSET },
      });

      if (!assetAccount) {
        throw new Error(`ASSET account not found for company: ${companyId}`);
      }

      const equityAccount = await this.getOrCreateAccount(companyId, AccountType.MEMBER_EQUITY, 'Member Equity');

      // Debit ASSET (cash increases), Credit MEMBER_EQUITY (equity increases)
      const entry = await this.ledgerService.executeTransfer({
        debitAccountId: assetAccount.id,
        creditAccountId: equityAccount.id,
        amount: data.amount,
        description: data.description ?? `Capital deposit of ${data.amount}`,
        userId,
        companyId,
      });

      this.logger.log(`Deposit of ${data.amount} completed for company ${companyId}`);
      return entry;
    } catch (error) {
      this.logger.error(`Error processing deposit: ${(error as Error).message}`);
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


  async initiatePaymentRequest( paymentinfo:{
    companyId: string,
    amount: number,
    description: string,
    userId: string,
    phone: string
  }
  ) {
    return this.financialTransactionsRepository.initiatePaymentRequest(paymentinfo.companyId, paymentinfo.amount, paymentinfo.description, paymentinfo.userId, paymentinfo.phone);
  }
}
