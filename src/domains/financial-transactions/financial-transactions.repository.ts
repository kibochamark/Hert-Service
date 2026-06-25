import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';
import { AccountType } from 'generated/prisma/enums';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class FinancialTransactionsRepository {
  private logger = new Logger(FinancialTransactionsRepository.name);

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService ) {}

  async createReturnRecord(data: Prisma.ReturnRecordCreateInput) {
    try {
      this.logger.log(`Creating return record for investment ID: ${data?.investment?.connect?.id as string} with amount: ${data.amount}`);

      // const returnRecord = await this.prisma.returnRecord.create({ data });
      const returnRecord = await this.prisma.$transaction(async (tx) => {
        const createdRecord = await tx.returnRecord.create({ data, select:{
          id: true, amount: true,
          dateReceived: true,
          investment: {
            select: {
              id: true,
              companyId: true,
            }
          }
        } });

        // Find company ASSET account (destination of funds)
        const assetAccount = await tx.memberAccount.findFirst({
          where: { companyId: createdRecord.investment.companyId, type: AccountType.ASSET },
        });

        if (!assetAccount) {
          throw new Error(`ASSET account not found for company: ${createdRecord.investment.companyId}`);
        }

        // Find or create company INVESTMENT account (source)
        let investmentAccount = await tx.memberAccount.findFirst({
          where: { companyId: createdRecord.investment.companyId, type: AccountType.INVESTMENT },
        });

        if (!investmentAccount) {
          investmentAccount = await tx.memberAccount.create({
            data: {
              name: 'Investment Pool',
              type: AccountType.INVESTMENT,
              companyId: createdRecord.investment.companyId,
            },
          });
          this.logger.log(`Created INVESTMENT account: ${investmentAccount.id} for company: ${createdRecord.investment.companyId}`);
        }

        // Transfer: INVESTMENT → ASSET (cash returns to company)
        await tx.ledgerEntry.create({
          data: {
            debitAccountId: assetAccount.id,
            creditAccountId: investmentAccount.id,
            amount: createdRecord.amount,
            description: `Return for Investment ID: ${createdRecord.investment.id}`,
            transactionDate: createdRecord.dateReceived,
            referenceId: createdRecord.id,
          },
        });

        return createdRecord;
      })
      this.logger.log(`Return record created successfully with ID: ${returnRecord.id}`);
      return returnRecord;
    } catch (error:any) {
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

  // initiate a payment request for a contribution or investment return, which will be processed by the finance team
  async initiatePaymentRequest(companyId: string, amount: number, description: string, userId: string, phone: string) {
    try {
      this.logger.log(`Initiating payment request for company: ${companyId}, amount: ${amount}, description: ${description}`);
      // verify user exists
      const isexisting = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!isexisting) {
        throw new Error(`User with ID ${userId} does not exist`);
      }

      const provider_token_url= this.config.get('PAYMENT_PROVIDER_TOKEN_URL');
      const provider_payment_url= this.config.get('PAYMENT_PROVIDER_URL');

      // console.log(`Using payment provider token URL: ${provider_token_url}`);

      // get auth token from payment [rovider]
      const authToken = await fetch(`${provider_token_url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: this.config.get('PAYMENT_PROVIDER_API_KEY'), email: this.config.get('BUSINESS_EMAIL') }),
      }).then(res => res.json()).then(data => data?.data?.token);

      // console.log(`Obtained auth token from payment provider: ${authToken}`);

      if (!authToken) {
        throw new Error('Failed to obtain auth token from payment provider');
      }

      // initiate payment request in our system
      const [response] = await this.prisma.$transaction(async (tx) => {
        const paymentRequest= await fetch(`${provider_payment_url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
             amount:amount,
             phone: phone,
             callback_url: this.config.get('PAYMENT_CALLBACK_URL'),
            description: JSON.stringify({
              companyId,
              userId,
              description,
            }),
            }),
        }).then(res => res.json());

        // console.log(`Payment provider response:`, paymentRequest);



        if (!paymentRequest || !paymentRequest.success) {
          throw new Error('Failed to initiate payment request with payment provider');
        }

        await tx.transactionsTracker.create({
          data: {
            transactionId:`${userId}-${amount}-${Date.now()}`,
            checkoutRequestId: paymentRequest?.data?.checkout_request_id,
            metadata:{
              companyId,
              userId,
              description,
              phone,
              merchantRequestId: paymentRequest?.data?.merchant_request_id,
              checkoutRequestId: paymentRequest?.data?.checkout_request_id,
            }
          },
        });

        

        return [paymentRequest?.data];

      });

      this.logger.log(`Payment request initiated successfully for user: ${userId}`);
      return response;
    } catch (error) {
      this.logger.error(`Error initiating payment request for user: ${userId}`, error);
      throw error;
    }
  }
}
