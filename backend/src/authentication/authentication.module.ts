import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationController } from './authentication.controller';
import { CredentialManager } from './credential.manager';
import { TokenValidationStrategy } from './strategies/token-validation.strategy';
import { PermissionCheckGuard } from './guards/permission-check.guard';
import { AccessTokenGuard } from './guards/access-token.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'access-token' }),
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [AuthenticationController],
  providers: [
    CredentialManager,
    TokenValidationStrategy,
    PermissionCheckGuard,
    AccessTokenGuard,
  ],
  exports: [CredentialManager, PermissionCheckGuard, AccessTokenGuard],
})
export class AuthenticationModule {}
