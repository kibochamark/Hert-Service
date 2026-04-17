import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ContributionService } from '../domains/contribution/contribution.service';
import { CreateContributionDto, ApproveContributionDto, UpdateContributionDto, ContributionIdParam } from '../common/validators/contribution.validators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from 'generated/prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(RolesGuard)
@Controller('contribution')
export class ContributionController {
  constructor(private readonly contributionService: ContributionService) {}

  @Roles(Role.MEMBER, Role.ADMIN) // Members can create their own contributions
  @Post()
  @UseInterceptors(FileInterceptor('evidence'))
  async createContribution(@Body() createContributionDto: CreateContributionDto, @Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const userId = (req.user as any).id;
    const companyId = (req.user as any).companyId;




    console.log(`Creating contribution for user ${userId} in company ${companyId} with data:`, createContributionDto);
    return this.contributionService.createContribution({
      ...createContributionDto,
      amount: parseFloat(createContributionDto.amount), // Ensure amount is a number
      userId,
      companyId,
      
    }, file);
  }

  @Roles(Role.ADMIN, Role.MEMBER) // Admin can view all, Member can view their own
  @Get('user/:userId')
  async findContributionsByUser(@Param('userId') userId: string) {
    return this.contributionService.findContributionsByUser(userId);
  }

  @Roles(Role.ADMIN) // Only Admin can view contributions by company
  @Get('company/:companyId')
  async findContributionsByCompany(@Param('companyId') companyId: string) {
    return this.contributionService.findContributionsByCompany(companyId);
  }

  @Roles(Role.ADMIN, Role.MEMBER) // Admin can view any, Member can view their own
  @Get(':contributionId')
  async getContributionById(@Param() params: ContributionIdParam) {
    return this.contributionService.getContributionById(params.contributionId);
  }

  @Roles(Role.ADMIN) // Only Admin can approve/reject contributions
  @Put(':contributionId/approve')
  async approveContribution(
    @Param() params: ContributionIdParam,
    @Body() approveContributionDto: ApproveContributionDto,
    @Req() req: any,
  ) {
    const processedBy = (req.user as any).id; // Admin user ID
    return this.contributionService.approveContribution(params.contributionId, {
      ...approveContributionDto,
      processedBy,
    });
  }

  @Roles(Role.ADMIN, Role.MEMBER) // Admin can update any, Member can update their own (if PENDING)
  @Put(':contributionId')
  async updateContribution(
    @Param() params: ContributionIdParam,
    @Body() updateContributionDto: UpdateContributionDto,
  ) {
    return this.contributionService.updateContribution(params.contributionId, updateContributionDto);
  }

  @Roles(Role.ADMIN) // Only Admin can delete contributions
  @Delete(':contributionId')
  async deleteContribution(@Param() params: ContributionIdParam) {
    return this.contributionService.deleteContribution(params.contributionId);
  }

  @Roles(Role.ADMIN)
  @Get('company/:companyId/member-summary')
  async getMemberSummary(@Param('companyId') companyId: string) {
    return this.contributionService.getMemberSummaryByCompany(companyId);
  }
}
