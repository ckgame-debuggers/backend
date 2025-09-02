import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.cookies?.['sid'];
    if (!accessToken) return true;
    try {
      const user = await this.jwtService.verify(accessToken);
      request.user = user;
    } catch (err) {
      this.logger.debug(
        'Optional auth: invalid or expired token, continuing anonymously',
      );
    }
    return true;
  }
}

