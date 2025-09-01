import { ConflictException, Injectable } from '@nestjs/common';
import { CloudflareService } from './providers/cloudflare/cloudflare.service';

@Injectable()
export class AppService {
  constructor(private readonly cloudflareService: CloudflareService) {}

  getHello(): string {
    const version = require('../package.json').version;
    return `<html><body><h1>Debuggers API Server v.${version}</h1></body></html>`;
  }

  async getImageUploadUrl() {
    try {
      return await this.cloudflareService.getUploadUrl();
    } catch (e) {
      throw new ConflictException(e);
    }
  }

  async setUpload(id: string) {
    return await this.cloudflareService.setUploaded(id);
  }
}
