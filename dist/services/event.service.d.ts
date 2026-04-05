export declare class EventError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export interface EventResult {
    id: string;
    slug: string;
    name: string;
    date: Date;
    hostId: string;
    createdAt: Date;
    items?: {
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
    }[];
    guests?: {
        id: string;
        name: string;
        phone: string;
        eventId: string;
        createdAt: Date;
    }[];
}
/**
 * Generates a URL-friendly slug from a name + timestamp to ensure uniqueness.
 * Requirements: 3.1, 5.1
 */
export declare function generateSlug(name: string): string;
/**
 * Creates a new event for a host, generating a unique slug.
 * Requirements: 3.1
 */
export declare function createEvent(hostId: string, name: string, date: Date | string): Promise<EventResult>;
/**
 * Lists all events belonging to a host.
 * Requirements: 3.2
 */
export declare function listEvents(hostId: string): Promise<EventResult[]>;
/**
 * Gets a single event by id, ensuring it belongs to the host.
 * Includes items (with reservations) and confirmed guests for the dashboard panel.
 * Requirements: 3.2, 3.3, 4.5, 9.1, 9.2, 9.3
 */
export declare function getEvent(id: string, hostId: string): Promise<EventResult>;
/**
 * Updates an event's name and/or date, keeping the same slug.
 * Requirements: 3.3
 */
export declare function updateEvent(id: string, hostId: string, data: {
    name?: string;
    date?: Date | string;
}): Promise<EventResult>;
/**
 * Deletes an event, ensuring it belongs to the host.
 * Requirements: 3.4 (hosts can have multiple events, so delete is scoped)
 */
export declare function deleteEvent(id: string, hostId: string): Promise<void>;
//# sourceMappingURL=event.service.d.ts.map