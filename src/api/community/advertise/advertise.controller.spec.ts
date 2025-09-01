import { Test, TestingModule } from '@nestjs/testing';
import { AdvertiseController } from './advertise.controller';

describe('AdvertiseController', () => {
  let controller: AdvertiseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdvertiseController],
    }).compile();

    controller = module.get<AdvertiseController>(AdvertiseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
