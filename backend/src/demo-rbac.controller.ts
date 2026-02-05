import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from './authentication/guards/access-token.guard';
import { PermissionCheckGuard } from './authentication/guards/permission-check.guard';
import { RequirePermissions } from './authentication/decorators/permissions.decorator';
import { CurrentAccount } from './authentication/decorators/current-account.decorator';
import { ValidatedAccountInfo } from './authentication/interfaces/token.interface';

@Controller('demo')
@UseGuards(AccessTokenGuard, PermissionCheckGuard)
export class DemoRbacController {
  @Get('public-endpoint')
  @UseGuards(AccessTokenGuard)
  async publicEndpoint(@CurrentAccount() account: ValidatedAccountInfo) {
    return {
      message: 'This endpoint is accessible by any authenticated user',
      accountId: account.accountId,
      role: account.accountRole,
    };
  }

  @Get('admin-only')
  @RequirePermissions('ADMIN')
  async adminOnlyEndpoint() {
    return {
      message: 'This endpoint is accessible only by ADMIN users',
      sensitiveData: 'Top secret admin information',
    };
  }

  @Get('campaign-managers')
  @RequirePermissions('ADMIN', 'CAMPAIGN_MANAGER')
  async campaignManagerEndpoint(@CurrentAccount('emailAddress') email: string) {
    return {
      message: 'Accessible by ADMIN and CAMPAIGN_MANAGER',
      userEmail: email,
      campaigns: ['Campaign 1', 'Campaign 2'],
    };
  }

  @Get('directors-area')
  @RequirePermissions('ADMIN', 'DIRECTOR')
  async directorsEndpoint() {
    return {
      message: 'Directors and admins can access this',
      reports: ['Q1 Report', 'Q2 Report'],
    };
  }

  @Get('client-portal')
  @RequirePermissions('CLIENT', 'ADMIN')
  async clientPortal(@CurrentAccount() account: ValidatedAccountInfo) {
    return {
      message: 'Client portal access',
      accountDetails: {
        id: account.accountId,
        email: account.emailAddress,
        role: account.accountRole,
      },
    };
  }

  @Get('influencer-dashboard')
  @RequirePermissions('INFLUENCER', 'CAMPAIGN_MANAGER', 'ADMIN')
  async influencerDashboard() {
    return {
      message: 'Influencer dashboard with campaign stats',
      metrics: {
        followers: 10000,
        engagement: '5.2%',
        activeCampaigns: 3,
      },
    };
  }
}
