import { Test, TestingModule } from '@nestjs/testing';
import { DebuggersService } from './debuggers.service';

describe('DebuggersService', () => {
  let service: DebuggersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DebuggersService],
    }).compile();

    service = module.get<DebuggersService>(DebuggersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
