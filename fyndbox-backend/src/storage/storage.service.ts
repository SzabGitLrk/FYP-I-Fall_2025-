import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Storage } from './storage.entity';
import { User } from '../user/user.entity';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';
import { TranslationService } from '../translation/translation.service';
import { BaseService } from '../common/base.service';

@Injectable({ scope: Scope.REQUEST })
export class StorageService extends BaseService {
  constructor(
    @InjectRepository(Storage)
    private readonly storageRepository: Repository<Storage>,
    private readonly translationService: TranslationService,
  ) {
    super();
  }

  async search(userId: string, keyword: string): Promise<Storage[]> {
    const storages = await this.storageRepository.find({
      where: { userId },
      relations: ['boxes', 'boxes.items'],
    });

    const filteredStorages = storages
      .map((storage) => {
        const filteredBoxes = storage.boxes
          .map((box) => {
            const filteredItems = box.items.filter((item) =>
              item.name.toLowerCase().includes(keyword.toLowerCase()),
            );

            if (filteredItems.length > 0) {
              return { ...box, items: filteredItems };
            }
            return null;
          })
          .filter((box) => box !== null);

        if (filteredBoxes.length > 0) {
          return { ...storage, boxes: filteredBoxes };
        }
        return null;
      })
      .filter((storage) => storage !== null);

    return filteredStorages;
  }

  async findAll(userId: string): Promise<Storage[]> {
    return this.storageRepository.find({
      where: { userId },
      relations: ['boxes', 'boxes.items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Storage> {
    const storage = await this.storageRepository.findOne({
      where: { id, userId },
      relations: ['boxes', 'boxes.items'],
    });
    if (!storage) {
      throw new NotFoundException(
        this.translationService.getTranslation(
          'api.storages.notFoundById',
          this.getLang(),
          { id: id.toString() },
        ),
      );
    }
    return storage;
  }

  async create(
    createStorageDto: CreateStorageDto,
    userId: string,
  ): Promise<Storage> {
    const storage = this.storageRepository.create({
      ...createStorageDto,
      user: { id: userId } as User,
    });
    return this.storageRepository.save(storage);
  }

  async update(
    id: string,
    updateStorageDto: UpdateStorageDto,
    userId: string,
  ): Promise<Storage> {
    const storage = await this.findOne(id, userId);
    Object.assign(storage, updateStorageDto);
    return this.storageRepository.save(storage);
  }

  async remove(id: string, userId: string): Promise<void> {
    const storage = await this.findOne(id, userId);
    if (!storage) {
      throw new NotFoundException(
        this.translationService.getTranslation(
          'api.storages.notFoundById',
          this.getLang(),
          { id: id.toString() },
        ),
      );
    }
    await this.storageRepository.remove(storage);
  }
}
