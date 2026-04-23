import {
  BadRequestException,
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { basename, join } from 'path';
import { ProcessTextResponseDto } from '../dto/process-text-response.dto';
import { TextProcessingService } from './text-processing.service';

const ffmpegBinaryPath = require('ffmpeg-static') as string | null;

type VoiceProviderConfig = {
  apiKey: string;
  baseUrl: string;
  chunkDurationSeconds: number;
  chunkOverlapMs: number;
  language: string;
  modelName: string;
  prompt: string;
};

type VoiceTranscriptResult = {
  cleanedTranscript: string;
  rawTranscript: string;
};

@Injectable()
export class VoiceProcessingService {
  private readonly logger = new Logger(VoiceProcessingService.name);
  private readonly defaultOpenAiBaseUrl =
    'https://api.openai.com/v1/audio/transcriptions';
  private readonly fillerWordPattern =
    /\b(?:uh+|um+|ah+|er+|erm+|hmm+|mm+)\b/gi;
  // Accept both Whisper and the user-requested "Whisker" env aliases.
  private readonly voiceProviderConfig: VoiceProviderConfig = {
    apiKey:
      process.env.WHISPER_API_KEY ||
      process.env.WHISKER_API_KEY ||
      process.env.OPENAI_API_KEY ||
      '',
    baseUrl:
      process.env.WHISPER_BASE_URL ||
      process.env.WHISKER_BASE_URL ||
      this.defaultOpenAiBaseUrl,
    chunkDurationSeconds: this.resolveChunkDurationSeconds(
      process.env.WHISPER_CHUNK_DURATION_SECONDS ||
        process.env.WHISKER_CHUNK_DURATION_SECONDS,
    ),
    chunkOverlapMs: this.resolveChunkOverlapMs(
      process.env.WHISPER_CHUNK_OVERLAP_MS ||
        process.env.WHISKER_CHUNK_OVERLAP_MS,
    ),
    language:
      process.env.WHISPER_LANGUAGE || process.env.WHISKER_LANGUAGE || '',
    modelName:
      process.env.WHISPER_MODEL || process.env.WHISKER_MODEL || 'whisper-1',
    prompt: process.env.WHISPER_PROMPT || process.env.WHISKER_PROMPT || '',
  };

  constructor(private readonly textProcessingService: TextProcessingService) {}

  async processVoiceRequest(
    userId: string,
    file?: Express.Multer.File,
  ): Promise<ProcessTextResponseDto> {
    if (!file) {
      throw new BadRequestException(
        'Please record a voice instruction before saving.',
      );
    }

    const transcriptResult = await this.transcribeVoiceCommand(file);

    if (!transcriptResult.cleanedTranscript) {
      throw new BadRequestException(
        'We could not hear a clear instruction. Please try again.',
      );
    }

    return this.textProcessingService.processTextRequest(userId, {
      text: transcriptResult.cleanedTranscript,
    });
  }

  // This keeps the voice layer text-only so the result can be passed into the text pipeline.
  async transcribeVoiceCommand(
    file: Express.Multer.File,
  ): Promise<VoiceTranscriptResult> {
    this.ensureVoiceProviderIsConfigured();

    const tempDirectory = await mkdtemp(join(tmpdir(), 'fyndbox-voice-'));
    const inputPath = join(
      tempDirectory,
      `source.${this.defaultFileExtensionForMimeType(file.mimetype)}`,
    );
    const normalizedPath = join(tempDirectory, 'normalized.wav');

    try {
      await writeFile(inputPath, file.buffer);
      await this.preprocessAudioFile(inputPath, normalizedPath);

      const chunkPaths = await this.createChunkFiles(
        normalizedPath,
        tempDirectory,
      );
      const chunkTranscripts: string[] = [];

      for (const chunkPath of chunkPaths) {
        const nextTranscript = await this.transcribeChunkFile(chunkPath);
        if (nextTranscript) {
          chunkTranscripts.push(nextTranscript);
        }
      }

      // Merge chunk phrases carefully so overlap improves accuracy without doubling words.
      const rawTranscript = this.mergeChunkTranscripts(chunkTranscripts);
      const cleanedTranscript = this.cleanupTranscript(rawTranscript);

      if (!cleanedTranscript) {
        throw new BadRequestException(
          'We could not hear a clear instruction. Please try again.',
        );
      }

      return {
        cleanedTranscript,
        rawTranscript,
      };
    } finally {
      await rm(tempDirectory, { force: true, recursive: true });
    }
  }

  // Convert to mono 16 kHz WAV, trim leading/trailing silence, and normalize levels lightly.
  private async preprocessAudioFile(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    this.ensureFfmpegIsAvailable();

    await this.runFfmpegCommand([
      '-y',
      '-i',
      inputPath,
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-acodec',
      'pcm_s16le',
      '-af',
      'silenceremove=start_periods=1:start_silence=0.15:start_threshold=-45dB:stop_periods=1:stop_silence=0.25:stop_threshold=-45dB,dynaudnorm=f=75:g=7',
      outputPath,
    ]);
  }

  // Segment the cleaned WAV into short chunks so transcription stays fast.
  private async createChunkFiles(
    normalizedPath: string,
    tempDirectory: string,
  ): Promise<string[]> {
    void tempDirectory;
    return [normalizedPath];
  }

  private async transcribeChunkFile(chunkPath: string): Promise<string> {
    const formData = new FormData();
    const audioBytes = await readFile(chunkPath);

    formData.append(
      'file',
      new Blob([audioBytes], { type: 'audio/wav' }),
      basename(chunkPath),
    );
    formData.append('model', this.voiceProviderConfig.modelName);
    formData.append('response_format', 'json');
    formData.append('temperature', '0');

    if (this.voiceProviderConfig.language) {
      formData.append('language', this.voiceProviderConfig.language);
    }

    if (this.voiceProviderConfig.prompt) {
      formData.append('prompt', this.voiceProviderConfig.prompt);
    }

    try {
      const response = await fetch(this.voiceProviderConfig.baseUrl, {
        method: 'POST',
        headers: this.buildTranscriptionHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const responseBody = await response.text();
        this.logger.error(
          `Voice transcription failed with status ${response.status}: ${responseBody}`,
        );

        throw new InternalServerErrorException(
          'Voice transcription failed. Please try again.',
        );
      }

      const payload = (await response.json()) as { text?: string };
      return payload.text?.trim() || '';
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(
        `Voice transcription request failed: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        'Voice transcription is temporarily unavailable. Please try again.',
      );
    }
  }

  private cleanupTranscript(transcript: string): string {
    if (!transcript) {
      return '';
    }

    const withoutLineBreaks = transcript.replace(/[\r\n]+/g, ' ');
    const withoutFillers = withoutLineBreaks.replace(this.fillerWordPattern, ' ');
    const normalizedWhitespace = withoutFillers.replace(/\s+/g, ' ').trim();

    return this.removeRepeatedWords(normalizedWhitespace);
  }

  private mergeChunkTranscripts(chunkTranscripts: string[]): string {
    return chunkTranscripts.reduce((mergedText, nextChunkText) => {
      const trimmedChunk = nextChunkText.trim();

      if (!trimmedChunk) {
        return mergedText;
      }

      if (!mergedText) {
        return trimmedChunk;
      }

      return this.mergeTranscriptPair(mergedText, trimmedChunk);
    }, '');
  }

  private mergeTranscriptPair(currentTranscript: string, nextTranscript: string): string {
    const currentTokens = currentTranscript.split(/\s+/).filter(Boolean);
    const nextTokens = nextTranscript.split(/\s+/).filter(Boolean);
    const maxOverlap = Math.min(8, currentTokens.length, nextTokens.length);

    for (let overlapSize = maxOverlap; overlapSize >= 1; overlapSize -= 1) {
      const currentSuffix = currentTokens.slice(-overlapSize);
      const nextPrefix = nextTokens.slice(0, overlapSize);

      if (this.areTokenWindowsEquivalent(currentSuffix, nextPrefix)) {
        return [...currentTokens, ...nextTokens.slice(overlapSize)].join(' ');
      }
    }

    return `${currentTranscript} ${nextTranscript}`.trim();
  }

  private areTokenWindowsEquivalent(leftTokens: string[], rightTokens: string[]): boolean {
    return leftTokens.every((token, index) =>
      this.normalizeTranscriptToken(token) ===
      this.normalizeTranscriptToken(rightTokens[index] || ''),
    );
  }

  private removeRepeatedWords(transcript: string): string {
    const tokens = transcript.split(/\s+/).filter(Boolean);
    const result: string[] = [];

    for (const token of tokens) {
      const normalizedToken = token
        .replace(/^[^\w]+|[^\w]+$/g, '')
        .toLowerCase();
      const previousToken = result[result.length - 1];
      const normalizedPreviousToken = previousToken
        ? previousToken.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase()
        : '';

      if (
        normalizedToken &&
        normalizedToken === normalizedPreviousToken &&
        !/^\d+$/.test(normalizedToken)
      ) {
        continue;
      }

      result.push(token);
    }

    return result.join(' ').trim();
  }

  private normalizeTranscriptToken(token: string): string {
    return token.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase();
  }

  private buildTranscriptionHeaders(): Record<string, string> {
    if (!this.voiceProviderConfig.apiKey) {
      return {};
    }

    return {
      Authorization: `Bearer ${this.voiceProviderConfig.apiKey}`,
    };
  }

  private async runFfmpegCommand(args: string[]): Promise<void> {
    this.ensureFfmpegIsAvailable();

    await new Promise<void>((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpegBinaryPath as string, args, {
        windowsHide: true,
      });
      let stderr = '';

      ffmpegProcess.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      ffmpegProcess.on('error', (error) => {
        reject(error);
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            stderr.trim() || `ffmpeg exited with status code ${code ?? -1}.`,
          ),
        );
      });
    });
  }

  private ensureVoiceProviderIsConfigured(): void {
    const usingDefaultOpenAiEndpoint =
      this.voiceProviderConfig.baseUrl === this.defaultOpenAiBaseUrl;

    if (usingDefaultOpenAiEndpoint && !this.voiceProviderConfig.apiKey) {
      throw new BadRequestException(
        'Voice transcription is not configured. Add WHISPER_API_KEY or OPENAI_API_KEY in the backend .env file.',
      );
    }
  }

  private ensureFfmpegIsAvailable(): void {
    if (!ffmpegBinaryPath) {
      throw new InternalServerErrorException(
        'Voice preprocessing is not configured. Add ffmpeg before using voice transcription.',
      );
    }
  }

  private resolveChunkDurationSeconds(
    input: string | undefined,
  ): number {
    const value = Number(input || 4);

    if (Number.isNaN(value)) {
      return 4;
    }

    return Math.min(5, Math.max(2, Math.round(value)));
  }

  private resolveChunkOverlapMs(input: string | undefined): number {
    const value = Number(input || 900);

    if (Number.isNaN(value)) {
      return 900;
    }

    return Math.min(1500, Math.max(250, Math.round(value)));
  }

  private async getWavDurationSeconds(filePath: string): Promise<number> {
    const wavBytes = await readFile(filePath);
    const fallbackDuration = Math.max(0, (wavBytes.length - 44) / (16000 * 2));

    if (
      wavBytes.length < 44 ||
      wavBytes.toString('ascii', 0, 4) !== 'RIFF' ||
      wavBytes.toString('ascii', 8, 12) !== 'WAVE'
    ) {
      return fallbackDuration;
    }

    let offset = 12;
    let sampleRate = 16000;
    let channelCount = 1;
    let bitsPerSample = 16;
    let dataSize = 0;

    while (offset + 8 <= wavBytes.length) {
      const chunkId = wavBytes.toString('ascii', offset, offset + 4);
      const chunkSize = wavBytes.readUInt32LE(offset + 4);

      if (chunkId === 'fmt ' && offset + 24 <= wavBytes.length) {
        channelCount = wavBytes.readUInt16LE(offset + 10);
        sampleRate = wavBytes.readUInt32LE(offset + 12);
        bitsPerSample = wavBytes.readUInt16LE(offset + 22);
      }

      if (chunkId === 'data') {
        dataSize = chunkSize;
        break;
      }

      offset += 8 + chunkSize + (chunkSize % 2);
    }

    const bytesPerSecond = sampleRate * channelCount * (bitsPerSample / 8);
    if (!dataSize || !bytesPerSecond) {
      return fallbackDuration;
    }

    return dataSize / bytesPerSecond;
  }

  private defaultFileExtensionForMimeType(mimeType: string | undefined): string {
    const normalizedMimeType = mimeType || 'audio/webm';

    if (normalizedMimeType.includes('mp4')) {
      return 'm4a';
    }

    if (normalizedMimeType.includes('ogg')) {
      return 'ogg';
    }

    if (
      normalizedMimeType.includes('mpeg') ||
      normalizedMimeType.includes('mp3')
    ) {
      return 'mp3';
    }

    if (normalizedMimeType.includes('wav')) {
      return 'wav';
    }

    return 'webm';
  }
}
