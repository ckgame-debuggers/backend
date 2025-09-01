import { Test, TestingModule } from '@nestjs/testing';
import { AdvertiseService } from './advertise.service';

describe('AdvertiseService', () => {
  let service: AdvertiseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvertiseService],
    }).compile();

    service = module.get<AdvertiseService>(AdvertiseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
