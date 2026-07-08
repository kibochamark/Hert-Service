import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req, Patch, Version } from '@nestjs/common';
import { InvestmentService } from '../investment.service';
import { CreateInvestmentDto, UpdateInvestmentDto, InvestmentIdParam, UpdateInvestmentStatusDto } from '../../../common/validators/investment.validators';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { InvestmentStatus, Prisma, Role } from 'generated/prisma/client';
import { Request } from 'express';

@UseGuards(RolesGuard)
 // All routes in this controller require ADMIN role
@Controller('investment')
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  @Post()
  @Version('1')
  @Roles(Role.ADMIN)
  async createInvestment(@Body() createInvestmentDto: CreateInvestmentDto, @Req() req: Request) {
    const companyId = (req.user as any).companyId;
    const userId = (req.user as any).id;
    return this.investmentService.createInvestment(
      {
        ...createInvestmentDto,
        purchaseDate: new Date(createInvestmentDto.purchaseDate),
        company: { connect: { id: companyId } },
      },
      userId,
    );
  }

  @Get()
  @Version('1')
  @Roles(Role.ADMIN, Role.MEMBER) // Both ADMIN and MEMBER can view investments
  async findAllInvestments() {
    return this.investmentService.findAllInvestments();
  }

  @Get(':investmentId')
  @Version('1')
  @Roles(Role.ADMIN, Role.MEMBER) // Both ADMIN and MEMBER can view investments
  async findInvestmentById(@Param() params: InvestmentIdParam) {
    return this.investmentService.findInvestmentById(params.investmentId);
  }

  @Put(':investmentId')
  @Version('1')
  @Roles(Role.ADMIN) // Both ADMIN and MEMBER can update investments
  async updateInvestment(
    @Param() params: InvestmentIdParam,
    @Body() updateInvestmentDto: UpdateInvestmentDto,
  ) {
    const data: Prisma.InvestmentUpdateInput = {
      ...updateInvestmentDto,
      purchaseDate: updateInvestmentDto.purchaseDate ? new Date(updateInvestmentDto.purchaseDate) : undefined,
    };
    return this.investmentService.updateInvestment(params.investmentId, data);
  }

  @Patch(':investmentId/status')
  @Version('1')
  @Roles(Role.ADMIN) // Only ADMIN can update investment status
  async updateInvestmentStatus(
    @Param() params: InvestmentIdParam,
    @Body() updateInvestmentStatusDto: Partial<UpdateInvestmentStatusDto>,
  ) {
    return this.investmentService.updateInvestmentStatus(params.investmentId, updateInvestmentStatusDto.status as InvestmentStatus);
  }

  @Delete(':investmentId')
  @Version('1')
  @Roles(Role.ADMIN) // Only ADMIN can delete investments
  async deleteInvestment(@Param() params: InvestmentIdParam) {
    return this.investmentService.deleteInvestment(params.investmentId);
  }
}
