import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';


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

  // No explicit methods for expenses here, as they will be handled directly by LedgerService in the service layer.
}
