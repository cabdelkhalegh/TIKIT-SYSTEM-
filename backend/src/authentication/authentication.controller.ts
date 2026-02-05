import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { CredentialManager } from './credential.manager';
import { RegisterAccountDto, LoginCredentialsDto, TokenResponseDto, AccountProfileDto } from './dto/auth.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { CurrentAccount } from './decorators/current-account.decorator';

@Controller('auth')
export class AuthenticationController {
  constructor(private credentialManager: CredentialManager) {}

  @Post('register')
  async register(@Body() registrationData: RegisterAccountDto): Promise<TokenResponseDto> {
    return this.credentialManager.registerNewAccount(registrationData);
  }

  @Post('login')
  async login(@Body() credentials: LoginCredentialsDto): Promise<TokenResponseDto> {
    return this.credentialManager.validateCredentials(credentials);
  }

  @Get('profile')
  @UseGuards(AccessTokenGuard)
  async getProfile(@CurrentAccount('accountId') accountId: string): Promise<AccountProfileDto> {
    return this.credentialManager.fetchAccountProfile(accountId);
  }
}
