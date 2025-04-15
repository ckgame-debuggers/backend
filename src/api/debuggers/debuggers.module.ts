import { Module } from '@nestjs/common';
import { DebuggersController } from './debuggers.controller';
import { DebuggersService } from './debuggers.service';

@Module({
  controllers: [DebuggersController],
  providers: [DebuggersService]
})
export class DebuggersModule {}
