import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';
import { AccountType } from 'generated/prisma/enums';


@Injectable()
export class FinancialTransactionsRepository {
  private logger = new Logger(FinancialTransactionsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async createReturnRecord(data: Prisma.ReturnRecordCreateInput) {
    try {
      this.logger.log(`Creating return record for investment ID: ${data?.investment?.connect?.id as string} with amount: ${data.amount}`);
      const returnRecord = await this.prisma.returnRecord.create({ data });
      this.logger.log(`Return record created successfully with ID: ${returnRecord.id}`);
      return returnRecord;
    } catch (error) {
      this.logger.error(`Error creating return record: ${error.message}`);
      throw error;
    }
  }

  async findReturnRecordsByCompany(companyId: string) {
    try {
      this.logger.log(`Fetching return records for company: ${companyId}`);
      const records = await this.prisma.returnRecord.findMany({
        where: { investment: { companyId } },
        include: { investment: { select: { id: true, name: true, category: true } } },
        orderBy: { dateReceived: 'desc' },
      });
      this.logger.log(`Found ${records.length} return records for company: ${companyId}`);
      return records;
    } catch (error) {
      this.logger.error(`Error fetching return records for company: ${companyId}`, error);
      throw error;
    }
  }

  async findExpensesByCompany(companyId: string) {
    try {
      this.logger.log(`Fetching expenses for company: ${companyId}`);
      const entries = await this.prisma.ledgerEntry.findMany({
        where: {
          debitAccount: { companyId, type: AccountType.EXPENSE },
        },
        include: {
          debitAccount: { select: { id: true, name: true, type: true } },
          creditAccount: { select: { id: true, name: true, type: true } },
        },
        orderBy: { transactionDate: 'desc' },
      });
      this.logger.log(`Found ${entries.length} expense entries for company: ${companyId}`);
      return entries;
    } catch (error) {
      this.logger.error(`Error fetching expenses for company: ${companyId}`, error);
      throw error;
    }
  }

  async getPortfolioSummary(companyId: string) {
    try {
      this.logger.log(`Fetching portfolio summary for company: ${companyId}`);

      const [investments, accounts, memberCount] = await Promise.all([
        this.prisma.investment.findMany({ where: { companyId } }),
        this.prisma.memberAccount.findMany({
          where: { companyId, userId: null },
          select: { type: true, balance: true },
        }),
        this.prisma.user.count({ where: { companyId } }),
      ]);

      const nonLiquidated = investments.filter(i => i.status !== 'LIQUIDATED');
      const totalInvested = nonLiquidated.reduce((sum, i) => sum + i.principal.toNumber(), 0);

      const revenue = accounts.find(a => a.type === AccountType.REVENUE)?.balance.toNumber() ?? 0;
      const expenses = accounts.find(a => a.type === AccountType.EXPENSE)?.balance.toNumber() ?? 0;
      const cash = accounts.find(a => a.type === AccountType.ASSET)?.balance.toNumber() ?? 0;

      this.logger.log(`Portfolio summary fetched for company: ${companyId}`);
      return {
        totalInvested,
        totalPortfolioValue: totalInvested,
        totalRevenue: revenue,
        totalExpenses: expenses,
        netBalance: revenue - expenses,
        cashBalance: cash,
        activeInvestments: investments.filter(i => i.status === 'ACTIVE').length,
        maturedInvestments: investments.filter(i => i.status === 'MATURED').length,
        memberCount,
      };
    } catch (error) {
      this.logger.error(`Error fetching portfolio summary for company: ${companyId}`, error);
      throw error;
    }
  }

  async getCompanyBalance(companyId: string) {
    try {
      this.logger.log(`Fetching balance summary for company: ${companyId}`);

      // Company-level accounts have no userId (ASSET, INVESTMENT, REVENUE, EXPENSE)
      const accounts = await this.prisma.memberAccount.findMany({
        where: { companyId, userId: null },
        select: { id: true, name: true, type: true, balance: true },
      });

      const summary = {
        cash: accounts.find(a => a.type === AccountType.ASSET)?.balance ?? 0,
        invested: accounts.find(a => a.type === AccountType.INVESTMENT)?.balance ?? 0,
        totalRevenue: accounts.find(a => a.type === AccountType.REVENUE)?.balance ?? 0,
        totalExpenses: accounts.find(a => a.type === AccountType.EXPENSE)?.balance ?? 0,
        accounts,
      };

      this.logger.log(`Balance summary fetched for company: ${companyId}`);
      return summary;
    } catch (error) {
      this.logger.error(`Error fetching balance for company: ${companyId}`, error);
      throw error;
    }
  }
}
