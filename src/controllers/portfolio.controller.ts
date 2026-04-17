import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { FinancialTransactionsService } from '../domains/financial-transactions/financial-transactions.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from 'generated/prisma/client';
import { Request } from 'express';

@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.MEMBER)
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly financialTransactionsService: FinancialTransactionsService) {}

  @Get('summary')
  async getPortfolioSummary(@Req() req: Request) {
    const companyId = (req.user as any).companyId;
    return this.financialTransactionsService.getPortfolioSummary(companyId);
  }
}
