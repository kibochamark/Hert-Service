import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { CompanyService } from '../domains/company/company.service';
import { CreateCompanyDto, UpdateCompanyDto, CompanyIdParam } from '../common/validators/company.validators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from 'generated/prisma/client';

@UseGuards(RolesGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Public()
  @Post()
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.createCompany(createCompanyDto);
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Get(':companyId')
  async getCompanyById(@Param() params: CompanyIdParam) {
    return this.companyService.getCompanyById(params.companyId);
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Get(':companyId/profile')
  async getCompanyProfile(@Param() params: CompanyIdParam) {
    return this.companyService.getCompanyProfile(params.companyId);
  }

  @Roles(Role.ADMIN)
  @Patch(':companyId')
  async updateCompany(
    @Param() params: CompanyIdParam,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(params.companyId, updateCompanyDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':companyId')
  async deleteCompany(@Param() params: CompanyIdParam) {
    return this.companyService.deleteCompany(params.companyId);
  }
}
