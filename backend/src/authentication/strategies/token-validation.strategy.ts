import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayloadStructure, ValidatedAccountInfo } from '../interfaces/token.interface';
import { DataAccessLayer } from '../../database/data-access.layer';

@Injectable()
export class TokenValidationStrategy extends PassportStrategy(Strategy, 'access-token') {
  constructor(
    private configService: ConfigService,
    private dataLayer: DataAccessLayer,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: TokenPayloadStructure): Promise<ValidatedAccountInfo> {
    const account = await this.dataLayer.account.findUnique({
      where: { id: payload.accountId },
    });

    if (!account || !account.isActive) {
      throw new UnauthorizedException('Access denied - invalid account');
    }

    return {
      accountId: payload.accountId,
      emailAddress: payload.emailAddress,
      accountRole: payload.accountRole,
    };
  }
}
