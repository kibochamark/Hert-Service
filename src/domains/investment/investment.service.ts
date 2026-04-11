import { Injectable } from '@nestjs/common';
import { InvestmentRepository } from './investment.repository';
import { InvestmentStatus, Prisma } from 'generated/prisma/client';


@Injectable()
export class InvestmentService {
  constructor(private readonly investmentRepository: InvestmentRepository) {}

  async createInvestment(data: Prisma.InvestmentCreateInput) {
    return this.investmentRepository.createInvestment(data);
  }

  async findAllInvestments() {
    return this.investmentRepository.findAllInvestments();
  }

  async findInvestmentById(investmentId: string) {
    return this.investmentRepository.findInvestmentById(investmentId);
  }

  async updateInvestment(investmentId: string, data: Prisma.InvestmentUpdateInput) {
    return this.investmentRepository.updateInvestment(investmentId, data);
  }

  async updateInvestmentStatus(investmentId: string, status: InvestmentStatus) {
    return this.investmentRepository.updateInvestmentStatus(investmentId, status);
  }

  async deleteInvestment(investmentId: string) {
    return this.investmentRepository.deleteInvestment(investmentId);
  }
}
