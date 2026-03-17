import { Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Storage } from '../../../../storage/storage.entity';
import { HeavyNormalizationService } from './heavy-normalization.service';
import { AcknowledgementService } from './acknowledgement.service';

@Injectable()
export class DatabaseStorageService {
    constructor(
        private readonly normalization: HeavyNormalizationService,
        private readonly acknowledgement: AcknowledgementService,
        @Optional() private readonly dataSource?: DataSource,
    ) {}

    async getExistingContext(userId: string): Promise<{
        storages: Array<{ id: string; name: string; description?: string | null }>;
        boxes: Array<{ id: string; name: string; storageId: string }>;
        items: Array<{ id: string; name: string; quantity: number; boxId: string }>;
    }> {
        // Default context when DB is unavailable or empty.
        const context = {
            storages: [] as Array<{ id: string; name: string; description?: string | null }>,
            boxes: [] as Array<{ id: string; name: string; storageId: string }>,
            items: [] as Array<{ id: string; name: string; quantity: number; boxId: string }>,
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
            console.warn('Failed to fetch existing context:', (error as Error).message);
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
        return storages.find(
            (storage: any) => this.normalizeLookupName(storage.name) === normalizedTarget,
        ) || null;
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
        return boxes.find(
            (box: any) => this.normalizeLookupName(box.name) === normalizedTarget,
        ) || null;
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
        return items.find(
            (item: any) => this.normalizeLookupName(item.name) === normalizedTarget,
        ) || null;
    }

    /**
     * Persist the validated + normalized data to the database using a transaction.
     * Steps: Storage (find or create) -> Box (find or create) -> Item (find or create/update).
     */
    async persistToDatabase(normalizedData: any, userId: string): Promise<{ success: boolean; message: string; ids?: any; warnings?: string[] }> {
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
                        nextDescription
                        && (intent === 'create' || intent === 'update')
                        && this.normalizeDescriptionText((existingStorage as any).description) !== this.normalizeDescriptionText(nextDescription)
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
                    const savedStorage = await queryRunner.manager.save('Storage', newStorage);
                    storageId = (savedStorage as any).id;
                    storageAction = 'created';
                }
            }

            // --- Box Layer ---
            const boxIdMap = new Map<string, string>(); // clientRef -> DB id
            const boxActions: { name: string; action: 'created' | 'found'; items: string[] }[] = [];
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
                        throw new Error(`Item '${item.name}' could not be mapped to a box.`);
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
                            const hasDescriptionUpdate = !!item.description && item.description !== existing.description;
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
                                const boxEntry = normalizedData.boxes?.find((b: any) => b.clientRef === item.boxClientRef);
                                const boxName = boxEntry ? boxEntry.name : 'Unknown';
                                warnings.push(`'${item.name}' quantity set to 0 in '${boxName}' box (was ${oldQty}, tried to remove ${item.quantity || 1}).`);
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
                            const hasDescriptionInput = item.description !== null && item.description !== undefined;
                            const hasQuantityInput = item.quantity !== null && item.quantity !== undefined;
                            const descriptionChanged = hasDescriptionInput
                                && this.normalizeDescriptionText(item.description) !== this.normalizeDescriptionText(existing.description);
                            const quantityChanged = hasQuantityInput
                                && item.quantity !== oldQty;

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
                            const boxEntry = normalizedData.boxes?.find((b: any) => b.clientRef === item.boxClientRef);
                            const boxName = boxEntry ? boxEntry.name : 'Unknown';
                            throw new Error(`Item '${item.name}' not found in '${boxName}' box. Cannot remove a non-existent item.`);
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
            const actionLog = { storageAction, storageDescriptionUpdated, boxActions, itemActions };
            const acknowledgment = this.generateSmartAcknowledgment(normalizedData, actionLog);

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
                message: `Something went wrong. No changes were saved. ${error instanceof Error ? error.message : ''}`.trim(),
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
        expandedBoxes?: Array<{ originalName: string; normalizedOriginalName?: string; expandedNames: string[] }> | null,
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
            expansionByOriginalName.set(entry.originalName.toLowerCase(), entry.expandedNames);
            if (entry.normalizedOriginalName) {
                expansionByOriginalName.set(entry.normalizedOriginalName, entry.expandedNames);
            }
        });
        const expandedBoxList: any[] = [];
        const sourceItems = prepared.items.map((item: any) => ({ ...item }));
        const finalItems: any[] = [];

        for (const box of prepared.boxes) {
            const expandedNames = expansionByOriginalName.get(
                box.name.toLowerCase(),
            );
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
            const expandedRefs = expandedNames.map((name) => `${box.clientRef}:${name}`);

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

    private normalizeLookupName(name: string | null | undefined): string {
        return this.normalization.normalizeLookupName(name);
    }

    private normalizeDescriptionText(description?: string | null): string {
        return this.normalization.normalizeDescriptionText(description);
    }

    private generateSmartAcknowledgment(normalizedData: any, actionLog: any): string {
        return this.acknowledgement.generateSmartAcknowledgment(normalizedData, actionLog);
    }
}
