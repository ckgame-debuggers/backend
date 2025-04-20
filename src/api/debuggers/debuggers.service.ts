import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DebuggersService {
  private readonly logger = new Logger(DebuggersService.name);
  constructor(private readonly dataSource: DataSource) {}
}
