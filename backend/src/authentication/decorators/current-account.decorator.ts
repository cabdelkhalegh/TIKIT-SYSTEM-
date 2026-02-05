import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ValidatedAccountInfo } from '../interfaces/token.interface';

export const CurrentAccount = createParamDecorator(
  (field: keyof ValidatedAccountInfo | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const account = request.user as ValidatedAccountInfo;
    
    return field ? account?.[field] : account;
  },
);
