import { Test, TestingModule } from '@nestjs/testing';
import { DebuggersController } from './debuggers.controller';

describe('DebuggersController', () => {
  let controller: DebuggersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DebuggersController],
    }).compile();

    controller = module.get<DebuggersController>(DebuggersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
