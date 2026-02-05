import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ValidatedAccountInfo } from '../interfaces/token.interface';

@Injectable()
export class PermissionCheckGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const account: ValidatedAccountInfo = request.user;

    if (!account) {
      throw new ForbiddenException('Authentication required');
    }

    const hasPermission = requiredPermissions.includes(account.accountRole);

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions for this operation');
    }

    return true;
  }
}
