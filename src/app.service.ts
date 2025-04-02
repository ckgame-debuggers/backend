import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '<html><body><h1>Debuggers API Server</h1></body></html>';
  }
}
