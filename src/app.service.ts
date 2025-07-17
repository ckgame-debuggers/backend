import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    const version = require('../package.json').version;
    return `<html><body><h1>Debuggers API Server v.${version}</h1></body></html>`;
  }
}
