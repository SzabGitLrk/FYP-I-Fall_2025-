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

  it('should return interactive clarification payloads from process-text as a successful response', async () => {
    aiService.processText.mockResolvedValue({
      parsedData: null,
      classified: {
        clarification:
          "Multiple boxes match 'Shoes' in storage 'Stylo Mall'.",
        clarificationKind: 'box-family-selection',
        clarificationOptions: [
          { label: 'Shoes 1', prompt: 'remove 2 Pumpy from box Shoes 1', kind: 'box' },
        ],
      },
      fallbackToLLM: false,
      confidence: 0,
      rawInput: 'remove 2 pumpy from box shoes in storage stylo mall',
      llmBackup: 'remove 2 pumpy from box shoes in storage stylo mall',
      meta: {
        processedAt: new Date().toISOString(),
        processingTimeMs: 10,
        inputLength: 53,
      },
    } as any);

    const response = await controller.processText(
      { user: { userId: 'user-1' } },
      { text: 'remove 2 pumpy from box shoes in storage stylo mall' } as any,
    );

    expect(response.success).toBe(true);
    expect(response.data?.parsedData).toBeNull();
    expect(response.data?.classified?.clarificationKind).toBe(
      'box-family-selection',
    );
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
