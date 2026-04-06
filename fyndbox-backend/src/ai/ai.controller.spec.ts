import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;
  let aiService: jest.Mocked<AiService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: {
            processText: jest.fn(),
            processVoice: jest.fn(),
            transcribeVoice: jest.fn(),
            confirmResult: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    aiService = module.get(AiService);
  });

  it('should preserve the validation acknowledgement for process-text failures', async () => {
    aiService.processText.mockRejectedValue(
      new BadRequestException(
        "Please clarify your instruction. Try something like 'Create storage Garage with box Tools'.",
      ),
    );

    const response = await controller.processText(
      { user: { userId: 'user-1' } },
      { text: 'hello there' } as any,
    );

    expect(response.success).toBe(false);
    expect(response.message).toBe(
      "Please clarify your instruction. Try something like 'Create storage Garage with box Tools'.",
    );
    expect(response.error).toBe(response.message);
  });

  it('should preserve the validation acknowledgement for process-voice failures', async () => {
    aiService.processVoice.mockRejectedValue(
      new BadRequestException(
        'Please record a voice instruction before saving.',
      ),
    );

    const response = await controller.processVoice(
      { user: { userId: 'user-1' } },
      undefined,
    );

    expect(response.success).toBe(false);
    expect(response.message).toBe(
      'Please record a voice instruction before saving.',
    );
    expect(response.error).toBe(response.message);
  });

  it('should preserve the validation acknowledgement for transcribe-voice failures', async () => {
    aiService.transcribeVoice.mockRejectedValue(
      new BadRequestException(
        'Please record a voice instruction before saving.',
      ),
    );

    const response = await controller.transcribeVoice(undefined);

    expect(response.success).toBe(false);
    expect(response.message).toBe(
      'Please record a voice instruction before saving.',
    );
    expect(response.error).toBe(response.message);
  });

  it('should preserve the confirmation acknowledgement for confirm failures', async () => {
    aiService.confirmResult.mockRejectedValue(
      new BadRequestException('Please review the storage before saving boxes.'),
    );

    const response = await controller.confirmResult(
      { user: { userId: 'user-1' } },
      { confirmed: true, parsedData: {} } as any,
    );

    expect(response.success).toBe(false);
    expect(response.message).toBe(
      'Please review the storage before saving boxes.',
    );
    expect(response.error).toBe(response.message);
  });
});
