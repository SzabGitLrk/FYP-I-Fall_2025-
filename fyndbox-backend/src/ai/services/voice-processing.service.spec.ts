import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VoiceProcessingService } from './voice-processing.service';
import { TextProcessingService } from './text-processing.service';

describe('VoiceProcessingService', () => {
  let service: VoiceProcessingService;
  let textProcessingService: jest.Mocked<TextProcessingService>;

  beforeEach(async () => {
    process.env.WHISPER_API_KEY = 'test-whisper-key';
    process.env.WHISPER_CHUNK_DURATION_SECONDS = '4';
    process.env.WHISPER_CHUNK_OVERLAP_MS = '500';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceProcessingService,
        {
          provide: TextProcessingService,
          useValue: {
            processTextRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VoiceProcessingService>(VoiceProcessingService);
    textProcessingService = module.get(TextProcessingService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.WHISPER_API_KEY;
    delete process.env.WHISKER_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.WHISPER_BASE_URL;
    delete process.env.WHISKER_BASE_URL;
    delete process.env.WHISPER_MODEL;
    delete process.env.WHISKER_MODEL;
    delete process.env.WHISPER_LANGUAGE;
    delete process.env.WHISKER_LANGUAGE;
    delete process.env.WHISPER_PROMPT;
    delete process.env.WHISKER_PROMPT;
    delete process.env.WHISPER_CHUNK_DURATION_SECONDS;
    delete process.env.WHISKER_CHUNK_DURATION_SECONDS;
    delete process.env.WHISPER_CHUNK_OVERLAP_MS;
    delete process.env.WHISKER_CHUNK_OVERLAP_MS;
  });

  it('transcribes cleaned chunk text and forwards it into text processing', async () => {
    const processedResult = {
      parsedData: { storageName: 'Garage' },
      classified: { intent: 'create' },
      fallbackToLLM: false,
      confidence: 0.96,
      rawInput: 'open file in garage',
      llmBackup: 'open file in garage',
      meta: {
        processedAt: new Date().toISOString(),
        processingTimeMs: 12,
        inputLength: 19,
      },
    };

    jest
      .spyOn(service, 'transcribeVoiceCommand')
      .mockResolvedValue({
        rawTranscript: 'uh open open file in garage',
        cleanedTranscript: 'open file in garage',
      });
    textProcessingService.processTextRequest.mockResolvedValue(
      processedResult as any,
    );

    const result = await service.processVoiceRequest('user-1', {
      buffer: Buffer.from('audio'),
      mimetype: 'audio/webm',
      originalname: 'voice-note.webm',
    } as Express.Multer.File);

    expect(service.transcribeVoiceCommand).toHaveBeenCalled();
    expect(textProcessingService.processTextRequest).toHaveBeenCalledWith(
      'user-1',
      {
        text: 'open file in garage',
      },
    );
    expect(result).toEqual(processedResult);
  });

  it('rejects empty transcription responses with a user-friendly validation error', async () => {
    jest.spyOn(service, 'transcribeVoiceCommand').mockResolvedValue({
      rawTranscript: 'um uh',
      cleanedTranscript: '',
    });

    await expect(
      service.processVoiceRequest('user-1', {
        buffer: Buffer.from('audio'),
        mimetype: 'audio/webm',
        originalname: 'voice-note.webm',
      } as Express.Multer.File),
    ).rejects.toThrow(BadRequestException);
  });

  it('cleans filler words, repeated words, and line breaks from transcripts', () => {
    const cleaned = (service as any).cleanupTranscript(
      'uh open open\nfile um in in garage',
    );

    expect(cleaned).toBe('open file in garage');
  });

  it('clamps chunk duration to the expected near real-time range', () => {
    expect((service as any).resolveChunkDurationSeconds('1')).toBe(2);
    expect((service as any).resolveChunkDurationSeconds('4')).toBe(4);
    expect((service as any).resolveChunkDurationSeconds('8')).toBe(5);
  });

  it('clamps chunk overlap to a safe lightweight range', () => {
    expect((service as any).resolveChunkOverlapMs('-1')).toBe(0);
    expect((service as any).resolveChunkOverlapMs('500')).toBe(500);
    expect((service as any).resolveChunkOverlapMs('5000')).toBe(1000);
  });

  it('builds raw and cleaned transcript output from chunked transcription', async () => {
    jest
      .spyOn(service as any, 'preprocessAudioFile')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'createChunkFiles')
      .mockResolvedValue(['chunk-1.wav', 'chunk-2.wav']);
    jest
      .spyOn(service as any, 'transcribeChunkFile')
      .mockResolvedValueOnce('uh open open file in')
      .mockResolvedValueOnce('file in garage');

    const result = await service.transcribeVoiceCommand({
      buffer: Buffer.from('audio'),
      mimetype: 'audio/webm',
      originalname: 'voice-note.webm',
    } as Express.Multer.File);

    expect(result.rawTranscript).toBe('uh open open file in garage');
    expect(result.cleanedTranscript).toBe('open file in garage');
  });

  it('deduplicates short overlapped phrases between adjacent chunks', () => {
    const merged = (service as any).mergeChunkTranscripts([
      'please create storage garage with',
      'garage with box tools',
      'box tools and item hammer',
    ]);

    expect(merged).toBe('please create storage garage with box tools and item hammer');
  });
});
