import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<any> {
    try {
      const request = context.switchToHttp().getRequest();
      const access_token = request.cookies['sid'];
      const user = await this.jwtService.verify(access_token);
      request.user = user;
      return user;
    } catch (err) {
      this.logger.warn('Error verifying access token');
      return false;
    }
  }
}
