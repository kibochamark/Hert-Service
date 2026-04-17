import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { FinancialTransactionsService } from '../domains/financial-transactions/financial-transactions.service';
import { LogRevenueDto, LogExpenseDto } from '../common/validators/financial-transactions.validators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from 'generated/prisma/client';
import { Request } from 'express';

@UseGuards(RolesGuard)
@Roles(Role.ADMIN) // All routes in this controller require ADMIN role
@Controller('financial-transactions')
export class FinancialTransactionsController {
  constructor(private readonly financialTransactionsService: FinancialTransactionsService) {}

  @Post('revenue')
  async logRevenue(@Body() logRevenueDto: LogRevenueDto, @Req() req: Request) {
    const companyId = (req.user as any).companyId;
    const userId = (req.user as any).id;
    return this.financialTransactionsService.logRevenue(
      {
        ...logRevenueDto,
        dateReceived: new Date(logRevenueDto.dateReceived),
      },
      companyId,
      userId,
    );
  }

  @Post('expense')
  async logExpense(@Body() logExpenseDto: LogExpenseDto, @Req() req: Request) {
    const companyId = (req.user as any).companyId;
    const userId = (req.user as any).id;
    return this.financialTransactionsService.logExpense(
      {
        ...logExpenseDto,
        transactionDate: new Date(logExpenseDto.transactionDate),
      },
      companyId,
      userId,
    );
  }

  @Get('revenue')
  async getRevenue(@Req() req: Request) {
    const companyId = (req.user as any).companyId;
    return this.financialTransactionsService.getRevenue(companyId);
  }

  @Get('expenses')
  async getExpenses(@Req() req: Request) {
    const companyId = (req.user as any).companyId;
    return this.financialTransactionsService.getExpenses(companyId);
  }

  @Get('balance')
  async getCompanyBalance(@Req() req: Request) {
    const companyId = (req.user as any).companyId;
    return this.financialTransactionsService.getCompanyBalance(companyId);
  }
}
