import { Test, TestingModule } from '@nestjs/testing';
import { CrewController } from './crew.controller';

describe('CrewController', () => {
  let controller: CrewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrewController],
    }).compile();

    controller = module.get<CrewController>(CrewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
