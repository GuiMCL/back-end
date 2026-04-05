export declare class ItemError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export interface ItemResult {
    id: string;
    name: string;
    description: string | null;
    eventId: string;
    createdAt: Date;
    reservation: {
        id: string;
        guestName: string;
        guestPhone: string;
    } | null;
}
/**
 * Adds a new item to an event's list with status "available" (no reservation).
 * Requirements: 4.1
 */
export declare function addItem(eventId: string, hostId: string, name: string, description?: string): Promise<ItemResult>;
/**
 * Updates an item's name and/or description, preserving its reservation status.
 * Requirements: 4.4
 */
export declare function updateItem(itemId: string, eventId: string, hostId: string, data: {
    name?: string;
    description?: string | null;
}): Promise<ItemResult>;
/**
 * Deletes an item. If the item is already reserved, returns a flag so the
 * caller (route) can ask for confirmation before proceeding.
 * Requirements: 4.2, 4.3
 */
export declare function deleteItem(itemId: string, eventId: string, hostId: string, force?: boolean): Promise<{
    deleted: boolean;
    reserved: boolean;
}>;
//# sourceMappingURL=item.service.d.ts.map