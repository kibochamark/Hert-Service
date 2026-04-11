import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvestmentStatus, Prisma } from 'generated/prisma/client';
import { AuditAction } from 'generated/prisma/enums'; // Import AuditAction


@Injectable()
export class InvestmentRepository {
  private logger = new Logger(InvestmentRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async createInvestment(data: Prisma.InvestmentCreateInput) {
    try {
      this.logger.log(`Creating investment: ${data.name}`);
      const investment = await this.prisma.investment.create({ data });

      await this.prisma.auditLog.create({
        data: {
          action: AuditAction.CREATE,
          entityName: 'Investment',
          entityId: investment.id,
          newValue: JSON.stringify(investment),
          companyId: investment.companyId,
        },
      });

      this.logger.log(`Investment created successfully with ID: ${investment.id}`);
      return investment;
    } catch (error) {
      this.logger.error(`Error creating investment: ${error.message}`);
      throw error;
    }
  }

  async findAllInvestments() {
    try {
      this.logger.log('Fetching all investments');
      const investments = await this.prisma.investment.findMany();
      this.logger.log(`Found ${investments.length} investments`);
      return investments;
    } catch (error) {
      this.logger.error(`Error fetching all investments: ${error.message}`);
      throw error;
    }
  }

  async findInvestmentById(investmentId: string) {
    try {
      this.logger.log(`Fetching investment with ID: ${investmentId}`);
      const investment = await this.prisma.investment.findUnique({
        where: { id: investmentId },
      });
      if (!investment) {
        this.logger.warn(`Investment not found with ID: ${investmentId}`);
        return null;
      }
      this.logger.log(`Investment fetched successfully with ID: ${investmentId}`);
      return investment;
    } catch (error) {
      this.logger.error(`Error fetching investment: ${error.message}`);
      throw error;
    }
  }

  async updateInvestment(investmentId: string, data: Prisma.InvestmentUpdateInput) {
    try {
      this.logger.log(`Updating investment with ID: ${investmentId}`);
      const oldInvestment = await this.prisma.investment.findUnique({ where: { id: investmentId } });
      if (!oldInvestment) {
        throw new Error(`Investment with ID ${investmentId} not found for update.`);
      }

      const updatedInvestment = await this.prisma.investment.update({
        where: { id: investmentId },
        data,
      });

      await this.prisma.auditLog.create({
        data: {
          action: AuditAction.UPDATE,
          entityName: 'Investment',
          entityId: investmentId,
          oldValue: JSON.stringify(oldInvestment),
          newValue: JSON.stringify(updatedInvestment),
          companyId: updatedInvestment.companyId,
        },
      });

      this.logger.log(`Investment updated successfully with ID: ${updatedInvestment.id}`);
      return updatedInvestment;
    } catch (error) {
      this.logger.error(`Error updating investment: ${error.message}`);
      throw error;
    }
  }

  async updateInvestmentStatus(investmentId: string, status: InvestmentStatus) {
    try {
      this.logger.log(`Updating status for investment ID: ${investmentId} to ${status}`);
      const oldInvestment = await this.prisma.investment.findUnique({ where: { id: investmentId } });
      if (!oldInvestment) {
        throw new Error(`Investment with ID ${investmentId} not found for status update.`);
      }

      const updatedInvestment = await this.prisma.investment.update({
        where: { id: investmentId },
        data: { status },
      });

      await this.prisma.auditLog.create({
        data: {
          action: AuditAction.UPDATE,
          entityName: 'Investment',
          entityId: investmentId,
          oldValue: JSON.stringify(oldInvestment),
          newValue: JSON.stringify(updatedInvestment),
          companyId: updatedInvestment.companyId,
        },
      });

      this.logger.log(`Investment status updated successfully for ID: ${updatedInvestment.id}`);
      return updatedInvestment;
    } catch (error) {
      this.logger.error(`Error updating investment status: ${error.message}`);
      throw error;
    }
  }

  async deleteInvestment(investmentId: string) {
    try {
      this.logger.log(`Deleting investment with ID: ${investmentId}`);
      const deletedInvestment = await this.prisma.investment.delete({
        where: { id: investmentId },
      });

      await this.prisma.auditLog.create({
        data: {
          action: AuditAction.DELETE,
          entityName: 'Investment',
          entityId: investmentId,
          oldValue: JSON.stringify(deletedInvestment),
          companyId: deletedInvestment.companyId,
        },
      });

      this.logger.log(`Investment deleted successfully with ID: ${deletedInvestment.id}`);
      return deletedInvestment;
    } catch (error) {
      this.logger.error(`Error deleting investment: ${error.message}`);
      throw error;
    }
  }
}
