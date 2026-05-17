import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  const mockAppService = {
    getHealthCheck: jest.fn().mockReturnValue('Health check...'),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = moduleRef.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return health check message', () => {
      const result = appController.getHello();

      expect(result).toBe('Health check...');
      expect(mockAppService.getHealthCheck).toHaveBeenCalledTimes(1);
    });
  });
});