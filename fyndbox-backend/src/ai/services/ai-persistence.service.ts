import { HttpStatus, Injectable, Logger, Optional } from '@nestjs/common';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import * as pluralize from 'pluralize';
import { DataSource } from 'typeorm';
import { Storage } from '../../storage/storage.entity';
import { DICTIONARY_CONFIG } from '../config/nlp-dictionary.config';
import { ConfirmAiResultDto } from '../dto/confirm-ai-result.dto';

@Injectable()
export class AiPersistenceService {
  private readonly logger = new Logger(AiPersistenceService.name);
  private readonly NON_SINGULARIZABLE_WORDS = new Set(
    DICTIONARY_CONFIG.NON_SINGULARIZABLE_WORDS,
  );

  constructor(@Optional() private readonly dataSource?: DataSource) {}

  async confirmAndPersistRequest(
    userId: string | undefined,
    confirmDto: ConfirmAiResultDto,
  ): Promise<ApiResponse<any>> {
    try {
      const parsedData = confirmDto.parsedData ?? confirmDto.data;

      if (!parsedData) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'No data provided for persistence',
          data: null,
        };
      }

      if (parsedData.confirmation && !confirmDto.confirmed) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Please confirm this change before saving.',
          data: null,
        };
      }

      const result = await this.persistToDatabase(parsedData, userId || '');

      if (result.success) {
        this.logger.log(`Data persisted successfully for user ${userId}`);
      } else {
        this.logger.warn(`Persistence failed: ${result.message}`);
      }

      return {
        statusCode: result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST,
        success: result.success,
        message: result.message,
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Error persisting data for user ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to save data. Please try again.',
        data: null,
      };
    }
  }

  async getExistingContext(userId: string): Promise<{
    storages: Array<{ id: string; name: string; description?: string | null }>;
    boxes: Array<{ id: string; name: string; storageId: string }>;
    items: Array<{ id: string; name: string; quantity: number; boxId: string }>;
  }> {
    // Default context when DB is unavailable or empty.
    const context = {
      storages: [] as Array<{
        id: string;
        name: string;
        description?: string | null;
      }>,
      boxes: [] as Array<{ id: string; name: string; storageId: string }>,
      items: [] as Array<{
        id: string;
        name: string;
        quantity: number;
        boxId: string;
      }>,
    };

    try {
      // Skip DB lookups when no dataSource is provided.
      if (!this.dataSource) {
        return context;
      }

      // Load storages with nested boxes and items.
      const storages = await this.dataSource.getRepository(Storage).find({
        where: { userId },
        relations: ['boxes', 'boxes.items'],
        order: { createdAt: 'DESC' },
      });

      // Flatten storage data for downstream intent logic.
      context.storages = storages.map((storage) => ({
        id: storage.id,
        name: storage.name,
        description: storage.description ?? null,
      }));

      context.boxes = storages.flatMap((storage) =>
        (storage.boxes || []).map((box) => ({
          id: box.id,
          name: box.name,
          storageId: storage.id,
        })),
      );

      context.items = storages.flatMap((storage) =>
        (storage.boxes || []).flatMap((box) =>
          (box.items || []).map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity || 0,
            boxId: box.id,
          })),
        ),
      );
    } catch (error) {
      // If DB fetch fails, return empty context (will use defaults)
      console.warn(
        'Failed to fetch existing context:',
        (error as Error).message,
      );
    }

    return context;
  }

  private async findExistingStorageByName(
    manager: any,
    userId: string,
    storageName: string,
  ): Promise<any | null> {
    // Normalize names to keep lookups consistent.
    const storages = await manager.find('Storage', {
      where: { userId },
    });

    const normalizedTarget = this.normalizeLookupName(storageName);
    return (
      storages.find(
        (storage: any) =>
          this.normalizeLookupName(storage.name) === normalizedTarget,
      ) || null
    );
  }

  private async findExistingBoxByName(
    manager: any,
    storageId: string,
    boxName: string,
  ): Promise<any | null> {
    // Find a box by normalized name within a storage.
    const boxes = await manager.find('Box', {
      where: { storageId },
    });

    const normalizedTarget = this.normalizeLookupName(boxName);
    return (
      boxes.find(
        (box: any) => this.normalizeLookupName(box.name) === normalizedTarget,
      ) || null
    );
  }

  private async findExistingItemByName(
    manager: any,
    boxId: string,
    itemName: string,
  ): Promise<any | null> {
    // Find an item by normalized name within a box.
    const items = await manager.find('Item', {
      where: { boxId },
    });

    const normalizedTarget = this.normalizeLookupName(itemName);
    return (
      items.find(
        (item: any) => this.normalizeLookupName(item.name) === normalizedTarget,
      ) || null
    );
  }

  /**
   * Persist the validated + normalized data to the database using a transaction.
   * Steps: Storage (find or create) -> Box (find or create) -> Item (find or create/update).
   */
  async persistToDatabase(
    normalizedData: any,
    userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    ids?: any;
    warnings?: string[];
  }> {
    // Fail fast when DB access is missing.
    if (!this.dataSource) {
      return { success: false, message: 'Database connection not available.' };
    }

    // Use a transaction to keep storage/box/item updates consistent.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const intent = normalizedData.intent; // 'create' | 'increment' | 'decrement' | 'update'

      // --- Storage Layer ---
      let storageId: string | null = null;
      let storageAction: 'created' | 'found' | null = null;
      let storageDescriptionUpdated = false;
      if (normalizedData.storageName) {
        const existingStorage = await this.findExistingStorageByName(
          queryRunner.manager,
          userId,
          normalizedData.storageName,
        );

        if (existingStorage) {
          storageId = (existingStorage as any).id;
          storageAction = 'found';
          const nextDescription = normalizedData.storageDescription || null;
          if (
            nextDescription &&
            (intent === 'create' || intent === 'update') &&
            this.normalizeDescriptionText(
              (existingStorage as any).description,
            ) !== this.normalizeDescriptionText(nextDescription)
          ) {
            (existingStorage as any).description = nextDescription;
            await queryRunner.manager.save('Storage', existingStorage);
            storageDescriptionUpdated = true;
          }
        } else {
          const newStorage = queryRunner.manager.create('Storage', {
            name: normalizedData.storageName,
            description: normalizedData.storageDescription || null,
            userId,
          });
          const savedStorage = await queryRunner.manager.save(
            'Storage',
            newStorage,
          );
          storageId = (savedStorage as any).id;
          storageAction = 'created';
        }
      }

      // --- Box Layer ---
      const boxIdMap = new Map<string, string>(); // clientRef -> DB id
      const boxActions: {
        name: string;
        action: 'created' | 'found';
        items: string[];
      }[] = [];
      if (normalizedData.boxes?.length > 0 && storageId) {
        for (const box of normalizedData.boxes) {
          const existingBox = await this.findExistingBoxByName(
            queryRunner.manager,
            storageId,
            box.name,
          );

          if (existingBox) {
            boxIdMap.set(box.clientRef, (existingBox as any).id);
            boxActions.push({ name: box.name, action: 'found', items: [] });
          } else {
            const newBox = queryRunner.manager.create('Box', {
              name: box.name,
              description: box.description || null,
              storageId,
            });
            const savedBox = await queryRunner.manager.save('Box', newBox);
            const boxId = (savedBox as any).id;

            // Generate QR Payload after save (needs DB-assigned ID)
            const qrPayload = JSON.stringify({
              boxId,
              name: box.name,
              storageId,
              createdAt: new Date().toISOString(),
            });
            (savedBox as any).qrPayload = qrPayload;
            await queryRunner.manager.save('Box', savedBox);

            boxIdMap.set(box.clientRef, boxId);
            boxActions.push({ name: box.name, action: 'created', items: [] });
          }
        }
      }

      // --- Item Layer (Intent-Based) ---
      const savedItemIds: string[] = [];
      const warnings: string[] = [];
      const itemActions: {
        name: string;
        action: string;
        oldQty?: number;
        newQty?: number;
        boxClientRef?: string;
        quantityChanged?: boolean;
        descriptionChanged?: boolean;
      }[] = [];

      if (normalizedData.items?.length > 0) {
        for (const item of normalizedData.items) {
          const boxId = boxIdMap.get(item.boxClientRef);
          if (!boxId) {
            throw new Error(
              `Item '${item.name}' could not be mapped to a box.`,
            );
          }

          const existingItem = await this.findExistingItemByName(
            queryRunner.manager,
            boxId,
            item.name,
          );

          if (existingItem) {
            // --- Scenario A: Item Exists ---
            const existing = existingItem as any;
            const oldQty = existing.quantity || 0;

            if (intent === 'increment') {
              existing.quantity = oldQty + (item.quantity || 1);
              itemActions.push({
                name: item.name,
                action: 'incremented',
                oldQty,
                newQty: existing.quantity,
                boxClientRef: item.boxClientRef,
                quantityChanged: true,
                descriptionChanged: false,
              });
            } else if (intent === 'create') {
              const hasDescriptionUpdate =
                !!item.description && item.description !== existing.description;
              if (item.explicitQuantity) {
                existing.quantity = oldQty + (item.quantity || 1);
                if (hasDescriptionUpdate) {
                  existing.description = item.description;
                }
                itemActions.push({
                  name: item.name,
                  action: 'incremented',
                  oldQty,
                  newQty: existing.quantity,
                  boxClientRef: item.boxClientRef,
                  quantityChanged: true,
                  descriptionChanged: hasDescriptionUpdate,
                });
              } else if (hasDescriptionUpdate) {
                existing.description = item.description;
                itemActions.push({
                  name: item.name,
                  action: 'modified',
                  oldQty,
                  newQty: existing.quantity,
                  boxClientRef: item.boxClientRef,
                  quantityChanged: false,
                  descriptionChanged: true,
                });
              } else {
                itemActions.push({
                  name: item.name,
                  action: 'unchanged',
                  oldQty,
                  newQty: existing.quantity,
                  boxClientRef: item.boxClientRef,
                  quantityChanged: false,
                  descriptionChanged: false,
                });
                savedItemIds.push(existing.id);
                continue;
              }
            } else if (intent === 'decrement') {
              const newQty = oldQty - (item.quantity || 1);
              if (newQty < 0) {
                existing.quantity = 0;
                const boxEntry = normalizedData.boxes?.find(
                  (b: any) => b.clientRef === item.boxClientRef,
                );
                const boxName = boxEntry ? boxEntry.name : 'Unknown';
                warnings.push(
                  `'${item.name}' quantity set to 0 in '${boxName}' box (was ${oldQty}, tried to remove ${item.quantity || 1}).`,
                );
              } else {
                existing.quantity = newQty;
              }
              itemActions.push({
                name: item.name,
                action: 'decremented',
                oldQty,
                newQty: existing.quantity,
                boxClientRef: item.boxClientRef,
                quantityChanged: true,
                descriptionChanged: false,
              });
            } else if (intent === 'update') {
              const hasDescriptionInput =
                item.description !== null && item.description !== undefined;
              const hasQuantityInput =
                item.quantity !== null && item.quantity !== undefined;
              const descriptionChanged =
                hasDescriptionInput &&
                this.normalizeDescriptionText(item.description) !==
                  this.normalizeDescriptionText(existing.description);
              const quantityChanged =
                hasQuantityInput && item.quantity !== oldQty;

              if (descriptionChanged) {
                existing.description = item.description;
              }
              if (quantityChanged) {
                existing.quantity = item.quantity;
              }

              if (!descriptionChanged && !quantityChanged) {
                itemActions.push({
                  name: item.name,
                  action: 'unchanged',
                  oldQty,
                  newQty: existing.quantity,
                  boxClientRef: item.boxClientRef,
                  quantityChanged: false,
                  descriptionChanged: false,
                });
                savedItemIds.push(existing.id);
                continue;
              }

              itemActions.push({
                name: item.name,
                action: 'modified',
                oldQty,
                newQty: existing.quantity,
                boxClientRef: item.boxClientRef,
                quantityChanged,
                descriptionChanged,
              });
            }

            const updated = await queryRunner.manager.save('Item', existing);
            savedItemIds.push(updated.id);
          } else {
            // --- Scenario B: Item Missing ---
            if (intent === 'decrement') {
              const boxEntry = normalizedData.boxes?.find(
                (b: any) => b.clientRef === item.boxClientRef,
              );
              const boxName = boxEntry ? boxEntry.name : 'Unknown';
              throw new Error(
                `Item '${item.name}' not found in '${boxName}' box. Cannot remove a non-existent item.`,
              );
            }

            const newItem = queryRunner.manager.create('Item', {
              name: item.name,
              description: item.description || null,
              quantity: item.quantity || 1,
              boxId,
            });
            const savedItem = await queryRunner.manager.save('Item', newItem);
            savedItemIds.push((savedItem as any).id);
            itemActions.push({
              name: item.name,
              action: 'created',
              newQty: item.quantity || 1,
              boxClientRef: item.boxClientRef,
              quantityChanged: false,
              descriptionChanged: Boolean(item.description),
            });
          }
        }
      }

      await queryRunner.commitTransaction();

      // --- Phase 7: Smart Acknowledgment ---
      const actionLog = {
        storageAction,
        storageDescriptionUpdated,
        boxActions,
        itemActions,
      };
      const acknowledgment = this.generateSmartAcknowledgment(
        normalizedData,
        actionLog,
      );

      return {
        success: true,
        message: acknowledgment,
        ids: {
          storageId,
          boxIds: Object.fromEntries(boxIdMap),
          itemIds: savedItemIds,
        },
        warnings,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        success: false,
        message:
          `Something went wrong. No changes were saved. ${error instanceof Error ? error.message : ''}`.trim(),
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Expand sequential boxes into per-box entries before persistence.
   */
  prepareNormalizedDataForPersistence(
    normalizedData: any,
    expandedBoxes?: Array<{
      originalName: string;
      normalizedOriginalName?: string;
      expandedNames: string[];
    }> | null,
  ): any {
    // Clone to avoid mutating the original payload.
    const prepared = {
      ...normalizedData,
      boxes: [...(normalizedData.boxes || [])],
      items: [...(normalizedData.items || [])],
    };

    // No expansions, return as-is.
    if (!expandedBoxes || expandedBoxes.length === 0) {
      return prepared;
    }

    // Build lookup for expansion names.
    const expansionByOriginalName = new Map<string, string[]>();
    expandedBoxes.forEach((entry) => {
      expansionByOriginalName.set(
        entry.originalName.toLowerCase(),
        entry.expandedNames,
      );
      if (entry.normalizedOriginalName) {
        expansionByOriginalName.set(
          entry.normalizedOriginalName,
          entry.expandedNames,
        );
      }
    });
    const expandedBoxList: any[] = [];
    const sourceItems = prepared.items.map((item: any) => ({ ...item }));
    const finalItems: any[] = [];

    for (const box of prepared.boxes) {
      const expandedNames = expansionByOriginalName.get(box.name.toLowerCase());
      const relatedItems = sourceItems.filter(
        (item: any) => item.boxClientRef === box.clientRef,
      );

      // Keep original box when no expansion is needed.
      if (!expandedNames || expandedNames.length <= 1) {
        expandedBoxList.push({ ...box, quantity: null });
        finalItems.push(...relatedItems);
        continue;
      }

      // Create a clientRef per expanded name.
      const expandedRefs = expandedNames.map(
        (name) => `${box.clientRef}:${name}`,
      );

      expandedNames.forEach((name, index) => {
        expandedBoxList.push({
          ...box,
          name,
          quantity: null,
          clientRef: expandedRefs[index],
        });
      });

      if (relatedItems.length === expandedRefs.length) {
        relatedItems.forEach((item: any, index: number) => {
          finalItems.push({
            ...item,
            boxClientRef: expandedRefs[index],
          });
        });
      } else if (relatedItems.length > 0) {
        relatedItems.forEach((item: any) => {
          // Replicate per box when flagged, otherwise attach first.
          if (item.replicatePerExpandedBox) {
            expandedRefs.forEach((ref: string) => {
              finalItems.push({
                ...item,
                boxClientRef: ref,
              });
            });
            return;
          }

          finalItems.push({
            ...item,
            boxClientRef: expandedRefs[0],
          });
        });
      }
    }

    prepared.boxes = expandedBoxList;
    prepared.items = finalItems;
    return prepared;
  }

  generateSmartAcknowledgment(
    normalizedData: any,
    actionLog: {
      storageAction: 'created' | 'found' | null;
      storageDescriptionUpdated?: boolean;
      boxActions: {
        name: string;
        action: 'created' | 'found';
        items: string[];
      }[];
      itemActions: {
        name: string;
        action: string;
        oldQty?: number;
        newQty?: number;
        boxClientRef?: string;
        quantityChanged?: boolean;
        descriptionChanged?: boolean;
      }[];
    },
  ): string {
    const intent = normalizedData.intent;
    const storageLead = this.buildStorageAcknowledgmentLead(
      intent,
      normalizedData.storageName,
      actionLog.storageAction,
    );
    const isSequential = normalizedData.meta?.mappingStrategy === 'sequential';
    const storageDescriptionDetail = actionLog.storageDescriptionUpdated
      ? 'Updated the description.'
      : null;

    if (intent === 'create' && this.isCreateNoOp(actionLog)) {
      return this.buildCreateNoOpAcknowledgment(
        normalizedData,
        actionLog,
        storageLead,
      );
    }

    if (intent === 'update' && this.isUpdateNoOp(actionLog)) {
      return this.buildUpdateNoOpAcknowledgment(normalizedData, actionLog);
    }

    if (
      intent === 'create' &&
      isSequential &&
      actionLog.boxActions.length > 0
    ) {
      const sequentialMessage = this.buildSequentialAcknowledgment(
        normalizedData,
        actionLog,
        storageLead,
      );
      return storageDescriptionDetail
        ? `${sequentialMessage} ${storageDescriptionDetail}`
        : sequentialMessage;
    }

    let detailParts: string[] = [];

    switch (intent) {
      case 'create':
        detailParts = this.buildCreateAcknowledgmentDetails(
          normalizedData,
          actionLog,
        );
        break;
      case 'increment':
        detailParts = this.buildIncrementAcknowledgmentDetails(
          normalizedData,
          actionLog,
        );
        break;
      case 'decrement':
        detailParts = this.buildDecrementAcknowledgmentDetails(
          normalizedData,
          actionLog,
        );
        break;
      case 'update':
        detailParts = this.buildUpdateAcknowledgmentDetails(
          normalizedData,
          actionLog,
        );
        break;
      default:
        detailParts = this.buildCreateAcknowledgmentDetails(
          normalizedData,
          actionLog,
        );
        break;
    }

    if (storageDescriptionDetail) {
      detailParts.unshift(storageDescriptionDetail);
    }

    if (!storageLead && detailParts.length === 0) {
      return 'No changes were made.';
    }

    if (
      actionLog.storageDescriptionUpdated &&
      normalizedData.storageName &&
      detailParts.length === 1
    ) {
      return `Storage '${normalizedData.storageName}' already exists. Updated the description.`;
    }

    if (storageLead && detailParts.length === 0) {
      if (intent === 'create' && actionLog.storageAction === 'found') {
        return `${storageLead}. No changes needed.`;
      }
      return `${storageLead}.`;
    }

    if (!storageLead) {
      return detailParts.join(' ');
    }

    if (intent === 'create' && actionLog.storageAction === 'created') {
      const normalizedDetails = detailParts.map((detail) => detail.trim());

      if (
        normalizedDetails.length === 1 &&
        normalizedDetails[0].startsWith('Created box ')
      ) {
        return `${storageLead} and ${normalizedDetails[0]
          .replace(/^Created box /, 'box ')
          .replace(/\.$/, '.')}`;
      }

      if (
        normalizedDetails.length > 1 &&
        normalizedDetails.every((detail) => detail.startsWith('Created box '))
      ) {
        const boxLabels = normalizedDetails.map((detail) =>
          detail.replace(/^Created box /, '').replace(/\.$/, ''),
        );
        return `${storageLead} with boxes ${this.joinHumanList(boxLabels)}.`;
      }
    }

    return `${storageLead}. ${detailParts.join(' ')}`;
  }

  private isCreateNoOp(actionLog: {
    storageAction: 'created' | 'found' | null;
    storageDescriptionUpdated?: boolean;
    boxActions: {
      name: string;
      action: 'created' | 'found';
      items: string[];
    }[];
    itemActions: {
      name: string;
      action: string;
      oldQty?: number;
      newQty?: number;
      boxClientRef?: string;
      quantityChanged?: boolean;
      descriptionChanged?: boolean;
    }[];
  }): boolean {
    const hasExistingContent =
      actionLog.storageAction === 'found' ||
      actionLog.boxActions.some((box) => box.action === 'found') ||
      actionLog.itemActions.some((item) => item.action === 'unchanged');
    const hasCreatedBoxes = actionLog.boxActions.some(
      (box) => box.action === 'created',
    );
    const hasChangedItems = actionLog.itemActions.some(
      (item) => item.action !== 'unchanged',
    );

    return (
      hasExistingContent &&
      !actionLog.storageDescriptionUpdated &&
      !hasCreatedBoxes &&
      !hasChangedItems
    );
  }

  private isUpdateNoOp(actionLog: {
    storageAction: 'created' | 'found' | null;
    storageDescriptionUpdated?: boolean;
    boxActions: {
      name: string;
      action: 'created' | 'found';
      items: string[];
    }[];
    itemActions: {
      name: string;
      action: string;
      oldQty?: number;
      newQty?: number;
      boxClientRef?: string;
      quantityChanged?: boolean;
      descriptionChanged?: boolean;
    }[];
  }): boolean {
    return this.isCreateNoOp(actionLog);
  }

  private buildCreateNoOpAcknowledgment(
    normalizedData: any,
    actionLog: {
      storageAction: 'created' | 'found' | null;
      storageDescriptionUpdated?: boolean;
      boxActions: {
        name: string;
        action: 'created' | 'found';
        items: string[];
      }[];
      itemActions: {
        name: string;
        action: string;
        oldQty?: number;
        newQty?: number;
        boxClientRef?: string;
        quantityChanged?: boolean;
        descriptionChanged?: boolean;
      }[];
    },
    storageLead: string | null,
  ): string {
    const parts: string[] = [];

    if (storageLead) {
      parts.push(`${storageLead}.`);
    }

    const boxesWithoutItems: string[] = [];

    for (const box of actionLog.boxActions.filter(
      (entry) => entry.action === 'found',
    )) {
      const unchangedItems = this.getItemsForBox(
        normalizedData,
        actionLog.itemActions,
        box.name,
      ).filter((item) => item.action === 'unchanged');

      if (unchangedItems.length === 0) {
        boxesWithoutItems.push(`'${box.name}'`);
        continue;
      }

      parts.push(
        `Box '${box.name}' already contains ${this.joinHumanList(
          unchangedItems.map((item) => this.formatCreatedItemLabel(item)),
        )}.`,
      );
    }

    if (boxesWithoutItems.length > 0) {
      parts.push(
        boxesWithoutItems.length === 1
          ? `Box ${boxesWithoutItems[0]} already exists.`
          : `Boxes ${this.joinHumanList(boxesWithoutItems)} already exist.`,
      );
    }

    if (parts.length === 0) {
      return 'No changes were made.';
    }

    parts.push('No changes needed.');
    return parts.join(' ');
  }

  private buildUpdateNoOpAcknowledgment(
    normalizedData: any,
    actionLog: {
      storageAction: 'created' | 'found' | null;
      storageDescriptionUpdated?: boolean;
      boxActions: {
        name: string;
        action: 'created' | 'found';
        items: string[];
      }[];
      itemActions: {
        name: string;
        action: string;
        oldQty?: number;
        newQty?: number;
        boxClientRef?: string;
        quantityChanged?: boolean;
        descriptionChanged?: boolean;
      }[];
    },
  ): string {
    const parts: string[] = [];

    if (normalizedData.storageName && actionLog.storageAction === 'found') {
      parts.push(`Storage '${normalizedData.storageName}' already exists.`);
    }

    const boxesWithoutItems: string[] = [];

    for (const box of actionLog.boxActions.filter(
      (entry) => entry.action === 'found',
    )) {
      const unchangedItems = this.getItemsForBox(
        normalizedData,
        actionLog.itemActions,
        box.name,
      ).filter((item) => item.action === 'unchanged');

      if (unchangedItems.length === 0) {
        boxesWithoutItems.push(`'${box.name}'`);
        continue;
      }

      parts.push(
        `Box '${box.name}' already contains ${this.joinHumanList(
          unchangedItems.map((item) => this.formatCreatedItemLabel(item)),
        )}.`,
      );
    }

    if (boxesWithoutItems.length > 0) {
      parts.push(
        boxesWithoutItems.length === 1
          ? `Box ${boxesWithoutItems[0]} already exists.`
          : `Boxes ${this.joinHumanList(boxesWithoutItems)} already exist.`,
      );
    }

    if (parts.length === 0) {
      return 'No changes were made.';
    }

    if (
      parts.length === 1 &&
      normalizedData.storageName &&
      actionLog.storageAction === 'found'
    ) {
      return `No changes needed. Storage '${normalizedData.storageName}' is already up to date.`;
    }

    parts.push('No changes needed.');
    return parts.join(' ');
  }

  private buildStorageAcknowledgmentLead(
    intent: string,
    storageName: string | null,
    storageAction: 'created' | 'found' | null,
  ): string | null {
    if (!storageName) {
      return null;
    }

    if (storageAction === 'created') {
      return `Created new storage '${storageName}'`;
    }

    if (storageAction === 'found') {
      if (intent === 'create' || intent === 'update') {
        return `Storage '${storageName}' already exists`;
      }

      return `Updated '${storageName}'`;
    }

    return null;
  }

  private buildSequentialAcknowledgment(
    normalizedData: any,
    actionLog: {
      storageAction: 'created' | 'found' | null;
      boxActions: {
        name: string;
        action: 'created' | 'found';
        items: string[];
      }[];
      itemActions: {
        name: string;
        action: string;
        oldQty?: number;
        newQty?: number;
        boxClientRef?: string;
      }[];
    },
    storageLead: string | null,
  ): string {
    const condensedSequentialMessage =
      this.buildCondensedSequentialAcknowledgment(
        normalizedData,
        actionLog,
        storageLead,
      );
    if (condensedSequentialMessage) {
      return condensedSequentialMessage;
    }

    const boxParts = actionLog.boxActions.map((box) => {
      const boxItems = this.getItemsForBox(
        normalizedData,
        actionLog.itemActions,
        box.name,
      );

      if (boxItems.length === 0) {
        return `'${box.name}'`;
      }

      const itemNames = boxItems
        .map((item) => this.formatCreatedItemLabel(item))
        .join(', ');
      return `'${box.name}' (with ${itemNames})`;
    });

    const boxCount = actionLog.boxActions.length;
    const boxPhrase = `${boxCount} box${boxCount > 1 ? 'es' : ''}: ${boxParts.join(', ')}.`;

    if (!storageLead) {
      return `Created ${boxPhrase}`;
    }

    if (actionLog.storageAction === 'created') {
      return `${storageLead} with ${boxPhrase}`;
    }

    const boxVerb = actionLog.boxActions.some((box) => box.action === 'created')
      ? 'Created'
      : 'Updated';
    return `${storageLead}. ${boxVerb} ${boxPhrase}`;
  }

  private buildCondensedSequentialAcknowledgment(
    normalizedData: any,
    actionLog: {
      storageAction: 'created' | 'found' | null;
      boxActions: {
        name: string;
        action: 'created' | 'found';
        items: string[];
      }[];
      itemActions: {
        name: string;
        action: string;
        oldQty?: number;
        newQty?: number;
        boxClientRef?: string;
      }[];
    },
    storageLead: string | null,
  ): string | null {
    if (actionLog.boxActions.length === 0) {
      return null;
    }

    const groupedBoxes = new Map<
      string,
      {
        baseName: string;
        count: number;
        action: 'created' | 'found';
        itemLabels: string[];
        quantitySummary: string | null;
      }
    >();

    for (const box of actionLog.boxActions) {
      const baseName = this.getSequentialBaseName(box.name);
      const boxItems = this.getItemsForBox(
        normalizedData,
        actionLog.itemActions,
        box.name,
      );
      const itemLabels = boxItems.map((item) =>
        this.formatCreatedItemLabel(item),
      );
      const quantitySummary =
        boxItems.length === 1 && boxItems[0].newQty
          ? `x${boxItems[0].newQty}`
          : null;
      const key = `${baseName}::${itemLabels.join('|')}`;
      const existing = groupedBoxes.get(key);

      if (existing) {
        existing.count += 1;
        continue;
      }

      groupedBoxes.set(key, {
        baseName,
        count: 1,
        action: box.action,
        itemLabels,
        quantitySummary,
      });
    }

    if (groupedBoxes.size !== 1 || actionLog.boxActions.length <= 1) {
      return null;
    }

    const [group] = [...groupedBoxes.values()];
    if (group.count !== actionLog.boxActions.length) {
      return null;
    }

    const exactBoxNames = actionLog.boxActions
      .map((box) => box.name)
      .join(', ');
    const detail = group.quantitySummary
      ? `${group.count} boxes of '${group.baseName}' ${group.quantitySummary} in each: ${exactBoxNames}.`
      : `${group.count} boxes of '${group.baseName}': ${exactBoxNames}.`;

    if (!storageLead) {
      return `Created ${detail}`;
    }

    if (actionLog.storageAction === 'created') {
      return `${storageLead} with ${detail}`;
    }

    const verb = group.action === 'created' ? 'Created' : 'Updated';
    return `${storageLead}. ${verb} ${detail}`;
  }

  private getSequentialBaseName(boxName: string): string {
    const numberedSuffixMatch = boxName.match(/^(.*?)(?:\s+(?:with\s+)?\d+)$/i);
    if (numberedSuffixMatch?.[1]) {
      return numberedSuffixMatch[1].trim();
    }

    return boxName.trim();
  }

  private buildCreateAcknowledgmentDetails(
    normalizedData: any,
    actionLog: {
      boxActions: {
        name: string;
        action: 'created' | 'found';
        items: string[];
      }[];
      itemActions: {
        name: string;
        action: string;
        oldQty?: number;
        newQty?: number;
        boxClientRef?: string;
      }[];
    },
  ): string[] {
    if (actionLog.boxActions.length > 0) {
      return actionLog.boxActions.map((box) => {
        const boxItems = this.getItemsForBox(
          normalizedData,
          actionLog.itemActions,
          box.name,
        );
        const boxVerb = box.action === 'created' ? 'Created' : 'Updated';
        const hasOnlyUnchangedItems =
          boxItems.length > 0 &&
          boxItems.every((item) => item.action === 'unchanged');

        if (boxItems.length === 0) {
          if (box.action === 'found') {
            return `Box '${box.name}' already exists.`;
          }
          return `${boxVerb} box '${box.name}'.`;
        }

        if (box.action === 'found' && hasOnlyUnchangedItems) {
          const itemLabels = boxItems.map((item) =>
            this.formatCreatedItemLabel(item),
          );
          return `Box '${box.name}' already contains ${this.joinHumanList(itemLabels)}.`;
        }

        if (box.action === 'found') {
          const unchangedItems = boxItems.filter(
            (item) => item.action === 'unchanged',
          );
          const createdItems = boxItems.filter(
            (item) => item.action === 'created',
          );
          const incrementedItems = boxItems.filter(
            (item) => item.action === 'incremented',
          );
          const modifiedItems = boxItems.filter(
            (item) => item.action === 'modified',
          );
          const detailParts = [`Box '${box.name}' already exists.`];

          if (unchangedItems.length > 0) {
            detailParts.push(
              `Already contains ${this.joinHumanList(
                unchangedItems.map((item) => this.formatCreatedItemLabel(item)),
              )}.`,
            );
          }

          if (createdItems.length > 0) {
            detailParts.push(
              `Added ${this.joinHumanList(
                createdItems.map((item) => this.formatCreatedItemLabel(item)),
              )}.`,
            );
          }

          if (incrementedItems.length > 0) {
            detailParts.push(
              ...incrementedItems.map((item) => {
                const previousQty = item.oldQty || 0;
                const currentQty = item.newQty || previousQty;
                const added = Math.max(0, currentQty - previousQty);

                return `${item.name} already exists in '${box.name}'. Added ${added} more. New total: ${currentQty}.`;
              }),
            );
          }

          if (modifiedItems.length > 0) {
            detailParts.push(
              ...modifiedItems.map(
                (item) =>
                  `Updated '${item.name}'${item.newQty !== undefined ? ` to ${item.newQty}` : ''}.`,
              ),
            );
          }

          return detailParts.join(' ');
        }

        const itemLabels = boxItems.map((item) =>
          this.formatCreatedItemLabel(item),
        );
        return `${boxVerb} box '${box.name}' with ${this.joinHumanList(itemLabels)}.`;
      });
    }

    return actionLog.itemActions.map((item) => {
      const boxName = this.getBoxNameForItem(normalizedData, item.boxClientRef);
      return `Added ${item.newQty || 1} ${item.name}${boxName ? ` to '${boxName}' box` : ''}.`;
    });
  }

  private buildIncrementAcknowledgmentDetails(
    normalizedData: any,
    actionLog: {
      boxActions: {
        name: string;
        action: 'created' | 'found';
        items: string[];
      }[];
      itemActions: {
        name: string;
        action: string;
        oldQty?: number;
        newQty?: number;
        boxClientRef?: string;
        quantityChanged?: boolean;
        descriptionChanged?: boolean;
      }[];
    },
  ): string[] {
    const parts: string[] = [];
    const createdBoxNames = new Set(
      actionLog.boxActions
        .filter((box) => box.action === 'created')
        .map((box) => box.name),
    );

    for (const box of actionLog.boxActions.filter(
      (entry) => entry.action === 'created',
    )) {
      const boxItems = this.getItemsForBox(
        normalizedData,
        actionLog.itemActions,
        box.name,
      );

      if (boxItems.length === 0) {
        parts.push(`Created box '${box.name}'.`);
        continue;
      }

      const itemLabels = boxItems.map((item) =>
        this.formatCreatedItemLabel(item),
      );
      parts.push(
        `Created box '${box.name}' with ${this.joinHumanList(itemLabels)}.`,
      );
    }

    for (const item of actionLog.itemActions) {
      const boxName = this.getBoxNameForItem(normalizedData, item.boxClientRef);

      if (
        boxName &&
        createdBoxNames.has(boxName) &&
        item.action === 'created'
      ) {
        continue;
      }

      if (item.action === 'incremented') {
        const previousQty = item.oldQty || 0;
        const currentQty = item.newQty || previousQty;
        const added = Math.max(0, currentQty - previousQty);

        if (boxName) {
          parts.push(
            `${item.name} already exists in '${boxName}'. Added ${added} more. New total: ${currentQty}.`,
          );
        } else {
          parts.push(
            `Added ${added} more ${item.name}. New total: ${currentQty}.`,
          );
        }
        continue;
      }

      if (item.action === 'created') {
        const label = this.formatCreatedItemLabel(item);
        parts.push(
          boxName ? `Added ${label} to '${boxName}'.` : `Added ${label}.`,
        );
        continue;
      }

      if (item.action === 'modified') {
        if (
          item.quantityChanged &&
          item.oldQty !== undefined &&
          item.newQty !== undefined
        ) {
          parts.push(
            `Updated '${boxName || item.name}': ${item.name} quantity changed from ${item.oldQty} to ${item.newQty}.`,
          );
          continue;
        }

        parts.push(
          `Updated '${boxName || item.name}': ${item.name} description was updated.`,
        );
      }
    }

    return parts;
  }

  private buildDecrementAcknowledgmentDetails(
    normalizedData: any,
    actionLog: {
      itemActions: {
        name: string;
        action: string;
        oldQty?: number;
        newQty?: number;
        boxClientRef?: string;
        quantityChanged?: boolean;
        descriptionChanged?: boolean;
      }[];
    },
  ): string[] {
    return actionLog.itemActions.map((item) => {
      const remaining = item.newQty ?? 0;
      const removed = (item.oldQty || 0) - remaining;
      const boxName = this.getBoxNameForItem(normalizedData, item.boxClientRef);

      if (boxName) {
        return `Updated '${boxName}': Removed ${removed} ${item.name}. Remaining: ${remaining}.`;
      }

      return `Removed ${removed} ${item.name}. Remaining: ${remaining}.`;
    });
  }

  private buildUpdateAcknowledgmentDetails(
    normalizedData: any,
    actionLog: {
      boxActions: {
        name: string;
        action: 'created' | 'found';
        items: string[];
      }[];
      itemActions: {
        name: string;
        action: string;
        oldQty?: number;
        newQty?: number;
        boxClientRef?: string;
        quantityChanged?: boolean;
        descriptionChanged?: boolean;
      }[];
    },
  ): string[] {
    const parts: string[] = [];

    for (const box of actionLog.boxActions) {
      const boxItems = this.getItemsForBox(
        normalizedData,
        actionLog.itemActions,
        box.name,
      );

      if (box.action === 'created') {
        if (boxItems.length === 0) {
          parts.push(`Created box '${box.name}'.`);
          continue;
        }

        const createdLabels = boxItems
          .filter((item) => item.action === 'created')
          .map((item) => this.formatCreatedItemLabel(item));
        if (createdLabels.length === 0) {
          parts.push(`Created box '${box.name}'.`);
          continue;
        }

        parts.push(
          `Created box '${box.name}' with ${this.joinHumanList(createdLabels)}.`,
        );
        continue;
      }

      const createdItems = boxItems.filter((item) => item.action === 'created');
      if (createdItems.length > 0) {
        parts.push(
          `Added ${this.joinHumanList(
            createdItems.map((item) => this.formatCreatedItemLabel(item)),
          )} to existing box '${box.name}'.`,
        );
      }
    }

    for (const item of actionLog.itemActions) {
      const boxName = this.getBoxNameForItem(normalizedData, item.boxClientRef);

      if (item.action === 'modified') {
        if (
          item.quantityChanged &&
          item.oldQty !== undefined &&
          item.newQty !== undefined
        ) {
          parts.push(
            `Updated '${boxName || item.name}': ${item.name} quantity changed from ${item.oldQty} to ${item.newQty}.`,
          );
          continue;
        }

        if (item.descriptionChanged) {
          parts.push(
            `Updated '${boxName || item.name}': ${item.name} description was updated.`,
          );
        }
        continue;
      }

      if (item.action === 'created' && !boxName) {
        parts.push(
          `Created '${item.name}'${boxName ? ` in '${boxName}'` : ''}${item.newQty ? ` (x${item.newQty})` : ''}.`,
        );
      }
    }

    return parts;
  }

  private getItemsForBox(
    normalizedData: any,
    itemActions: Array<{
      name: string;
      action: string;
      oldQty?: number;
      newQty?: number;
      boxClientRef?: string;
    }>,
    boxName: string,
  ) {
    return itemActions.filter(
      (item) =>
        this.getBoxNameForItem(normalizedData, item.boxClientRef) === boxName,
    );
  }

  private getBoxNameForItem(
    normalizedData: any,
    boxClientRef?: string,
  ): string | null {
    if (!boxClientRef) {
      return null;
    }

    const box = normalizedData.boxes?.find(
      (entry: any) => entry.clientRef === boxClientRef,
    );
    return box?.name ?? null;
  }

  private formatCreatedItemLabel(item: {
    name: string;
    newQty?: number;
  }): string {
    const quantity = item.newQty ?? 1;
    return quantity > 1 ? `'${item.name}' (x${quantity})` : `'${item.name}'`;
  }

  private joinHumanList(values: string[]): string {
    if (values.length <= 1) {
      return values[0] || '';
    }

    if (values.length === 2) {
      return `${values[0]} and ${values[1]}`;
    }

    return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
  }

  private normalizeLookupName(name: string | null | undefined): string {
    return this.toSingular((name || '').trim().toLowerCase()).replace(
      /\s+/g,
      ' ',
    );
  }

  private normalizeDescriptionText(description?: string | null): string {
    return (description || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private toTitleCase(value: string): string {
    return value
      .split(/\s+/)
      .map((word) => {
        if (
          word.length >= 2 &&
          word === word.toUpperCase() &&
          /^[A-Z]+$/.test(word)
        ) {
          return word;
        }
        if (/\d/.test(word)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  private toSingular(value: string): string {
    return value
      .split(/\s+/)
      .map((word) => {
        if (
          word.length <= 2 ||
          (word === word.toUpperCase() && /^[A-Z]+$/.test(word))
        ) {
          return word;
        }
        if (this.NON_SINGULARIZABLE_WORDS.has(word.toLowerCase())) {
          return word;
        }
        return pluralize.singular(word);
      })
      .join(' ');
  }
}
