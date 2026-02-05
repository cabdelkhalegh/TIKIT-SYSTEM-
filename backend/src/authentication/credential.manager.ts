import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DataAccessLayer } from '../database/data-access.layer';
import { RegisterAccountDto, LoginCredentialsDto, TokenResponseDto, AccountProfileDto } from './dto/auth.dto';
import { TokenPayloadStructure } from './interfaces/token.interface';

@Injectable()
export class CredentialManager {
  constructor(
    private dataLayer: DataAccessLayer,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async registerNewAccount(registrationData: RegisterAccountDto): Promise<TokenResponseDto> {
    const existingAccount = await this.dataLayer.account.findUnique({
      where: { emailAddress: registrationData.emailAddress },
    });

    if (existingAccount) {
      throw new ConflictException('Account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registrationData.password, 12);

    const newAccount = await this.dataLayer.account.create({
      data: {
        emailAddress: registrationData.emailAddress,
        passwordHash: hashedPassword,
        fullName: registrationData.fullName,
      },
    });

    return this.generateTokenPair(newAccount.id, newAccount.emailAddress, newAccount.accountRole);
  }

  async validateCredentials(credentials: LoginCredentialsDto): Promise<TokenResponseDto> {
    const account = await this.dataLayer.account.findUnique({
      where: { emailAddress: credentials.emailAddress },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid credentials provided');
    }

    if (!account.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const passwordMatches = await bcrypt.compare(credentials.password, account.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials provided');
    }

    return this.generateTokenPair(account.id, account.emailAddress, account.accountRole);
  }

  async fetchAccountProfile(accountId: string): Promise<AccountProfileDto> {
    const account = await this.dataLayer.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        emailAddress: true,
        fullName: true,
        accountRole: true,
        isActive: true,
      },
    });

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    return account;
  }

  private async generateTokenPair(accountId: string, emailAddress: string, accountRole: string): Promise<TokenResponseDto> {
    const tokenPayload: TokenPayloadStructure = {
      accountId,
      emailAddress,
      accountRole,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.get<string>('JWT_SECRET_KEY'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME'),
    });

    const refreshToken = this.jwtService.sign(
      { accountId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
      },
    );

    await this.dataLayer.refreshToken.create({
      data: {
        tokenValue: refreshToken,
        accountId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME'),
    };
  }
}
