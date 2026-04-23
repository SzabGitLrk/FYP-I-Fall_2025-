import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationModule } from '../translation/translation.module';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { Storage } from './storage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Storage]), TranslationModule],
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
