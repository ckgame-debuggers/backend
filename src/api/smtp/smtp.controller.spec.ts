import { Test, TestingModule } from '@nestjs/testing';
import { SmtpController } from './smtp.controller';

describe('SmtpController', () => {
  let controller: SmtpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmtpController],
    }).compile();

    controller = module.get<SmtpController>(SmtpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
