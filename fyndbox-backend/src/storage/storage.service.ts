import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Storage } from './storage.entity';
import { User } from '../user/user.entity';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';
import { TranslationService } from '../translation/translation.service';
import { BaseService } from '../common/base.service';
import {
  SearchResultsDto,
  SearchResultItemDto,
  SearchResultBoxDto,
  SearchResultStorageDto,
} from './dto/search-results.dto';

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
    // If no keyword or empty, return all storages
    if (!keyword || keyword.trim() === '') {
      return this.findAll(userId);
    }

    const storages = await this.storageRepository.find({
      where: { userId },
      relations: ['boxes', 'boxes.items'],
    });

    const lowerKeyword = keyword.toLowerCase().trim();

    // Filter and structure the results
    const filteredStorages = storages
      .map((storage) => {
        // Check if storage name matches
        const storageNameMatches = storage.name
          .toLowerCase()
          .includes(lowerKeyword);

        // Check if storage description matches
        const storageDescMatches = storage.description
          ?.toLowerCase()
          .includes(lowerKeyword);

        const filteredBoxes = storage.boxes
          .map((box) => {
            // Check if box name matches
            const boxNameMatches = box.name
              .toLowerCase()
              .includes(lowerKeyword);

            // Check if box description matches
            const boxDescMatches = box.description
              ?.toLowerCase()
              .includes(lowerKeyword);

            // Filter items by name or description
            const filteredItems = box.items.filter(
              (item) =>
                item.name.toLowerCase().includes(lowerKeyword) ||
                item.description?.toLowerCase().includes(lowerKeyword),
            );

            // Include box if: box name/description matches OR it has matching items
            if (
              boxNameMatches ||
              boxDescMatches ||
              filteredItems.length > 0
            ) {
              return {
                ...box,
                // If box itself matches, include all items; otherwise only matching items
                items:
                  boxNameMatches || boxDescMatches
                    ? box.items
                    : filteredItems,
              };
            }
            return null;
          })
          .filter((box) => box !== null);

        // Include storage if: storage name/description matches OR it has matching boxes
        if (
          storageNameMatches ||
          storageDescMatches ||
          filteredBoxes.length > 0
        ) {
          return {
            ...storage,
            // If storage itself matches, include all boxes; otherwise only matching boxes
            boxes:
              storageNameMatches || storageDescMatches
                ? storage.boxes
                : filteredBoxes,
          };
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

  async searchStructured(
    userId: string,
    keyword: string,
  ): Promise<SearchResultsDto> {
    if (!keyword || keyword.trim() === '') {
      return {
        items: [],
        boxes: [],
        storages: [],
        keyword: '',
        totalResults: 0,
      };
    }

    const storages = await this.storageRepository.find({
      where: { userId },
      relations: ['boxes', 'boxes.items'],
    });

    const lowerKeyword = keyword.toLowerCase().trim();

    const items: SearchResultItemDto[] = [];
    const boxes: SearchResultBoxDto[] = [];
    const storagesResults: SearchResultStorageDto[] = [];

    storages.forEach((storage) => {
      // Check if storage name or description matches
      const storageMatches =
        storage.name.toLowerCase().includes(lowerKeyword) ||
        storage.description?.toLowerCase().includes(lowerKeyword);

      if (storageMatches) {
        // Add to storage results
        const totalItems = storage.boxes.reduce(
          (sum, box) => sum + (box.items?.length || 0),
          0,
        );
        storagesResults.push({
          id: storage.id,
          name: storage.name,
          description: storage.description,
          image: storage.image,
          boxCount: storage.boxes?.length || 0,
          itemCount: totalItems,
        });
      }

      // Check boxes
      storage.boxes.forEach((box) => {
        const boxMatches =
          box.name.toLowerCase().includes(lowerKeyword) ||
          box.description?.toLowerCase().includes(lowerKeyword);

        if (boxMatches && !storageMatches) {
          // Only add box if storage doesn't already match
          boxes.push({
            id: box.id,
            name: box.name,
            description: box.description,
            image: box.image,
            itemCount: box.items?.length || 0,
            storageId: storage.id,
            storageName: storage.name,
          });
        }

        // Check items
        box.items.forEach((item) => {
          const itemMatches =
            item.name.toLowerCase().includes(lowerKeyword) ||
            item.description?.toLowerCase().includes(lowerKeyword);

          if (itemMatches && !storageMatches && !boxMatches) {
            // Only add item if storage and box don't already match
            items.push({
              id: item.id,
              name: item.name,
              description: item.description,
              image: item.image,
              boxId: box.id,
              boxName: box.name,
              storageId: storage.id,
              storageName: storage.name,
            });
          }
        });
      });
    });

    return {
      items,
      boxes,
      storages: storagesResults,
      keyword,
      totalResults: items.length + boxes.length + storagesResults.length,
    };
  }
}
