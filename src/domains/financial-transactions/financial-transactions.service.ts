import { Injectable, Logger } from '@nestjs/common';
import { FinancialTransactionsRepository } from './financial-transactions.repository';
import { AccountType } from 'generated/prisma/enums';
import { LedgerService } from '../../domains/ledger/ledger.service';
import { PrismaService } from '../../prisma/prisma.service'; // To query for COMPANY_CASH account

@Injectable()
export class FinancialTransactionsService {
  private logger = new Logger(FinancialTransactionsService.name);

  constructor(
    private readonly financialTransactionsRepository: FinancialTransactionsRepository,
    private readonly ledgerService: LedgerService,
    private readonly prisma: PrismaService, // Inject PrismaService to find COMPANY_CASH account
  ) {}

  async logRevenue(data: { amount: number; dateReceived: Date; investmentId: string }, companyId: string, userId: string) {
    try {
      this.logger.log(`Logging revenue of ${data.amount} for company ${companyId}`);

      // 1. Create ReturnRecord
      const returnRecord = await this.financialTransactionsRepository.createReturnRecord({
        amount: data.amount,
        dateReceived: data.dateReceived,
        investment: { connect: { id: data.investmentId } },
      });

      // 2. Find COMPANY_CASH account for the company
      const companyCashAccount = await this.prisma.memberAccount.findFirst({
        where: {
          companyId: companyId,
          type: AccountType.ASSET,
          name: 'Main Cash Wallet', // Assuming 'Main Cash Wallet' is the COMPANY_CASH account
        },
      });

      if (!companyCashAccount) {
        throw new Error(`COMPANY_CASH account not found for company ID: ${companyId}`);
      }

      // 3. Move money into COMPANY_CASH account using LedgerService
      // This assumes revenue increases an asset account (COMPANY_CASH) and decreases a revenue account (or increases equity)
      // For simplicity, I'll assume it increases COMPANY_CASH (debit) and credits a generic REVENUE account or directly impacts equity.
      // For now, I'll just debit COMPANY_CASH and credit a placeholder.
      // A more robust implementation would involve a specific revenue account.
      await this.ledgerService.executeTransfer({
        debitAccountId: companyCashAccount.id,
        creditAccountId: 'REVENUE_ACCOUNT_PLACEHOLDER_ID', // This needs to be a real account ID
        amount: data.amount,
        description: `Revenue from investment return (ID: ${returnRecord.id})`,
        companyId: companyId,
        userId: userId,
        referenceId: returnRecord.id,
      });

      this.logger.log(`Revenue logged and moved to COMPANY_CASH for company ${companyId}`);
      return returnRecord;
    } catch (error) {
      this.logger.error(`Error logging revenue: ${error.message}`);
      throw error;
    }
  }

  async logExpense(data: { amount: number; description: string; transactionDate: Date }, companyId: string, userId: string) {
    try {
      this.logger.log(`Logging expense of ${data.amount} for company ${companyId}`);

      // 1. Find COMPANY_CASH account for the company
      const companyCashAccount = await this.prisma.memberAccount.findFirst({
        where: {
          companyId: companyId,
          type: AccountType.ASSET,
          name: 'Main Cash Wallet', // Assuming 'Main Cash Wallet' is the COMPANY_CASH account
        },
      });

      if (!companyCashAccount) {
        throw new Error(`COMPANY_CASH account not found for company ID: ${companyId}`);
      }

      // 2. Move money out of COMPANY_CASH account using LedgerService
      // This assumes expense decreases an asset account (COMPANY_CASH) and debits an expense account.
      // For now, I'll just credit COMPANY_CASH and debit a placeholder.
      // A more robust implementation would involve a specific expense account.
      await this.ledgerService.executeTransfer({
        debitAccountId: 'EXPENSE_ACCOUNT_PLACEHOLDER_ID', // This needs to be a real account ID
        creditAccountId: companyCashAccount.id,
        amount: data.amount,
        description: data.description,
        companyId: companyId,
        userId: userId,
        // referenceId: ... // If there's an expense record, its ID would go here
      });

      this.logger.log(`Expense logged and moved from COMPANY_CASH for company ${companyId}`);
      // No explicit expense record in DB, so just return success or the ledger entry if available
      return { success: true, message: 'Expense logged successfully' };
    } catch (error) {
      this.logger.error(`Error logging expense: ${error.message}`);
      throw error;
    }
  }
}
