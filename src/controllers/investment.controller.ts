import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req , Version} from '@nestjs/common';
import { InvestmentService } from '../domains/investment/investment.service';
import { CreateInvestmentDto, UpdateInvestmentDto, InvestmentIdParam, UpdateInvestmentStatusDto } from '../common/validators/investment.validators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Prisma, Role } from 'generated/prisma/client';
import { Request } from 'express';


// All routes in this controller require ADMIN role
@UseGuards(RolesGuard) 
@Controller('investment')
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  
  @Roles(`ADMIN`) // Both ADMIN and MEMBER can access investment routes
  @Post()
  async createInvestment(@Body() createInvestmentDto: CreateInvestmentDto, @Req() req: Request) {
    const {userId, companyId} = (req.user as any);
    return this.investmentService.createInvestment({
      ...createInvestmentDto,
      purchaseDate: new Date(createInvestmentDto.purchaseDate), // Convert string to Date
      company: { connect: { id: companyId } }, // Connect to company
    }, userId);
  }
  
  @Roles("ADMIN", "MEMBER") // Both ADMIN and MEMBER can view investments
  @Version('1')
  @Get()
  async findAllInvestments() {
    console.log("Fetching all investments");
    return this.investmentService.findAllInvestments();
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Get(':investmentId')
  async findInvestmentById(@Param() params: InvestmentIdParam) {
    return this.investmentService.findInvestmentById(params.investmentId);
  }

  @Version('1')
  @Put(':investmentId')
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


  @Put(':investmentId/status')
  async updateInvestmentStatus(
    @Param() params: InvestmentIdParam,
    @Body() updateInvestmentStatusDto: UpdateInvestmentStatusDto,
  ) {
    return this.investmentService.updateInvestmentStatus(params.investmentId, updateInvestmentStatusDto.status);
  }


  @Delete(':investmentId')  
  async deleteInvestment(@Param() params: InvestmentIdParam) {
    return this.investmentService.deleteInvestment(params.investmentId);
  }
}
