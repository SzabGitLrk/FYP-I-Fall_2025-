import { Injectable } from '@nestjs/common';
import { HeavyNormalizationService } from './heavy-normalization.service';

@Injectable()
export class AcknowledgementService {
    constructor(private readonly normalization: HeavyNormalizationService) {}

    generateConfirmationSummary(normalizedData: any): string {
        // Build a compact confirmation list for the UI.
        const lines: string[] = ['Ready to save:'];

        if (normalizedData.storageName) {
            lines.push(`  🗄️ Storage: ${normalizedData.storageName}${normalizedData.storageDescription ? ` (${normalizedData.storageDescription})` : ''}`);
        }

        if (normalizedData.boxes?.length > 0) {
            const boxNames = normalizedData.boxes.map((b: any) => b.name).join(', ');
            lines.push(`  📦 Boxes: ${boxNames}`);
        }

        if (normalizedData.items?.length > 0) {
            const itemDescriptions = normalizedData.items.map((item: any) => {
                const qty = item.quantity || 1;
                const boxRef = item.boxClientRef;
                // Find the box name by clientRef
                const box = normalizedData.boxes?.find((b: any) => b.clientRef === boxRef);
                const boxName = box ? box.name : 'Unknown';
                return `${item.name} (x${qty}) → ${boxName}`;
            });
            lines.push(`  🔩 Items: ${itemDescriptions.join(', ')}`);
        }

        lines.push('Confirm? [Yes / Cancel]');
        return lines.join('\n');
    }

    generateSmartAcknowledgment(
        normalizedData: any,
        actionLog: {
            storageAction: 'created' | 'found' | null;
            storageDescriptionUpdated?: boolean;
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
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
        // Compose an acknowledgment based on intent and actions.
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
            return this.buildUpdateNoOpAcknowledgment(
                normalizedData,
                actionLog,
            );
        }

        if (intent === 'create' && isSequential && actionLog.boxActions.length > 0) {
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

        if (actionLog.storageDescriptionUpdated && normalizedData.storageName && detailParts.length === 1) {
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
                normalizedDetails.length === 1
                && normalizedDetails[0].startsWith('Created box ')
            ) {
                return `${storageLead} and ${normalizedDetails[0]
                    .replace(/^Created box /, "box ")
                    .replace(/\.$/, '.')}`;
            }

            if (
                normalizedDetails.length > 1
                && normalizedDetails.every((detail) => detail.startsWith('Created box '))
            ) {
                const boxLabels = normalizedDetails.map((detail) =>
                    detail
                        .replace(/^Created box /, '')
                        .replace(/\.$/, ''),
                );
                return `${storageLead} with boxes ${this.joinHumanList(boxLabels)}.`;
            }
        }

        return `${storageLead}. ${detailParts.join(' ')}`;
    }

    private isCreateNoOp(actionLog: {
        storageAction: 'created' | 'found' | null;
        storageDescriptionUpdated?: boolean;
        boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
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
        const hasExistingContent = actionLog.storageAction === 'found'
            || actionLog.boxActions.some((box) => box.action === 'found')
            || actionLog.itemActions.some((item) => item.action === 'unchanged');
        const hasCreatedBoxes = actionLog.boxActions.some((box) => box.action === 'created');
        const hasChangedItems = actionLog.itemActions.some((item) => item.action !== 'unchanged');

        return hasExistingContent
            && !actionLog.storageDescriptionUpdated
            && !hasCreatedBoxes
            && !hasChangedItems;
    }

    private isUpdateNoOp(actionLog: {
        storageAction: 'created' | 'found' | null;
        storageDescriptionUpdated?: boolean;
        boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
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
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
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

        for (const box of actionLog.boxActions.filter((entry) => entry.action === 'found')) {
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
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
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

        for (const box of actionLog.boxActions.filter((entry) => entry.action === 'found')) {
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

        if (parts.length === 1 && normalizedData.storageName && actionLog.storageAction === 'found') {
            return `No changes needed. Storage '${normalizedData.storageName}' is already up to date.`;
        }

        parts.push('No changes needed.');
        return parts.join(' ');
    }

    // Build the storage-level prefix for acknowledgments.
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
            if (intent === 'create') {
                return `Storage '${storageName}' already exists`;
            }

            if (intent === 'update') {
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
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: { name: string; action: string; oldQty?: number; newQty?: number; boxClientRef?: string }[];
        },
        storageLead: string | null,
    ): string {
        const condensedSequentialMessage = this.buildCondensedSequentialAcknowledgment(
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

            const itemNames = boxItems.map((item) =>
                this.formatCreatedItemLabel(item),
            ).join(', ');
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
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: { name: string; action: string; oldQty?: number; newQty?: number; boxClientRef?: string }[];
        },
        storageLead: string | null,
    ): string | null {
        if (actionLog.boxActions.length === 0) {
            return null;
        }

        const groupedBoxes = new Map<string, {
            baseName: string;
            count: number;
            action: 'created' | 'found';
            itemLabels: string[];
            quantitySummary: string | null;
        }>();

        for (const box of actionLog.boxActions) {
            const baseName = this.getSequentialBaseName(box.name);
            const boxItems = this.getItemsForBox(
                normalizedData,
                actionLog.itemActions,
                box.name,
            );
            const itemLabels = boxItems.map((item) => this.formatCreatedItemLabel(item));
            const quantitySummary = boxItems.length === 1 && boxItems[0].newQty
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

        if (
            groupedBoxes.size !== 1
            || actionLog.boxActions.length <= 1
        ) {
            return null;
        }

        const [group] = [...groupedBoxes.values()];
        if (group.count !== actionLog.boxActions.length) {
            return null;
        }

        const exactBoxNames = actionLog.boxActions.map((box) => box.name).join(', ');
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
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: { name: string; action: string; oldQty?: number; newQty?: number; boxClientRef?: string }[];
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
                const hasOnlyUnchangedItems = boxItems.length > 0
                    && boxItems.every((item) => item.action === 'unchanged');

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
                    const unchangedItems = boxItems.filter((item) => item.action === 'unchanged');
                    const createdItems = boxItems.filter((item) => item.action === 'created');
                    const incrementedItems = boxItems.filter((item) => item.action === 'incremented');
                    const modifiedItems = boxItems.filter((item) => item.action === 'modified');
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
                            ...modifiedItems.map((item) =>
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
            const boxName = this.getBoxNameForItem(
                normalizedData,
                item.boxClientRef,
            );
            return `Added ${item.newQty || 1} ${item.name}${boxName ? ` to '${boxName}' box` : ''}.`;
        });
    }

    private buildIncrementAcknowledgmentDetails(
        normalizedData: any,
        actionLog: {
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
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

        for (const box of actionLog.boxActions.filter((entry) => entry.action === 'created')) {
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
            parts.push(`Created box '${box.name}' with ${this.joinHumanList(itemLabels)}.`);
        }

        for (const item of actionLog.itemActions) {
            const boxName = this.getBoxNameForItem(
                normalizedData,
                item.boxClientRef,
            );

            if (boxName && createdBoxNames.has(boxName) && item.action === 'created') {
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
                    boxName
                        ? `Added ${label} to '${boxName}'.`
                        : `Added ${label}.`,
                );
                continue;
            }

            if (item.action === 'modified') {
                if (item.quantityChanged && item.oldQty !== undefined && item.newQty !== undefined) {
                    parts.push(
                        `Updated '${boxName || item.name}': ${item.name} quantity changed from ${item.oldQty} to ${item.newQty}.`,
                    );
                    continue;
                }

                parts.push(`Updated '${boxName || item.name}': ${item.name} description was updated.`);
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
            const boxName = this.getBoxNameForItem(
                normalizedData,
                item.boxClientRef,
            );

            if (boxName) {
                return `Updated '${boxName}': Removed ${removed} ${item.name}. Remaining: ${remaining}.`;
            }

            return `Removed ${removed} ${item.name}. Remaining: ${remaining}.`;
        });
    }

    private buildUpdateAcknowledgmentDetails(
        normalizedData: any,
        actionLog: {
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
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
            const boxName = this.getBoxNameForItem(
                normalizedData,
                item.boxClientRef,
            );

            if (item.action === 'modified') {
                if (item.quantityChanged && item.oldQty !== undefined && item.newQty !== undefined) {
                    parts.push(
                        `Updated '${boxName || item.name}': ${item.name} quantity changed from ${item.oldQty} to ${item.newQty}.`,
                    );
                    continue;
                }

                if (item.descriptionChanged) {
                    parts.push(`Updated '${boxName || item.name}': ${item.name} description was updated.`);
                }
                continue;
            }

            if (item.action === 'created' && !boxName) {
                parts.push(`Created '${item.name}'${boxName ? ` in '${boxName}'` : ''}${item.newQty ? ` (x${item.newQty})` : ''}.`);
            }
        }

        return parts;
    }

    private getItemsForBox(
        normalizedData: any,
        itemActions: Array<{ name: string; action: string; oldQty?: number; newQty?: number; boxClientRef?: string }>,
        boxName: string,
    ) {
        return itemActions.filter(
            (item) => this.getBoxNameForItem(normalizedData, item.boxClientRef) === boxName,
        );
    }

    private getBoxNameForItem(normalizedData: any, boxClientRef?: string): string | null {
        if (!boxClientRef) {
            return null;
        }

        const box = normalizedData.boxes?.find(
            (entry: any) => entry.clientRef === boxClientRef,
        );
        return box?.name ?? null;
    }

    private formatCreatedItemLabel(item: { name: string; newQty?: number }): string {
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

    private toTitleCase(value: string): string {
        return this.normalization.toTitleCase(value);
    }

    private toSingular(value: string): string {
        return this.normalization.toSingular(value);
    }
}
