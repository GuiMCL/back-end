export declare class ListaError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
/**
 * Validates a Brazilian phone number (with DDD, 10 or 11 digits, digits only).
 * Accepts formats: 11999999999, 1199999999 (with or without 9th digit)
 * Requirements: 7.5
 */
export declare function isValidBrazilianPhone(phone: string): boolean;
export interface PublicItem {
    id: string;
    name: string;
    description: string | null;
    reserved: boolean;
    reservedBy: string | null;
}
export interface PublicListResponse {
    event: {
        name: string;
        date: string;
        slug: string;
    };
    items: PublicItem[];
    guestCount: number;
}
/**
 * Returns the public view of an event by slug.
 * Requirements: 5.4, 6.1, 6.2, 6.3
 */
export declare function getPublicList(slug: string): Promise<PublicListResponse>;
/**
 * Reserves an item for a guest. Validates phone format and item availability.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export declare function reserveItem(slug: string, itemId: string, guestName: string, guestPhone: string): Promise<{
    itemId: string;
    guestName: string;
}>;
/**
 * Confirms a guest's presence for an event. Upserts by phone+eventId.
 * Requirements: 8.1, 8.2, 8.3
 */
export declare function confirmPresence(slug: string, guestName: string, guestPhone: string): Promise<{
    guestName: string;
    guestPhone: string;
}>;
//# sourceMappingURL=lista.service.d.ts.map