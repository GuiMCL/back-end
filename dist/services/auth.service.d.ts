export interface JwtPayload {
    hostId: string;
    username: string;
}
export interface AuthResult {
    host: {
        id: string;
        name: string;
        username: string;
    };
    token: string;
}
export declare class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare function register(name: string, username: string, password: string): Promise<AuthResult>;
export declare function login(username: string, password: string): Promise<AuthResult>;
export declare function generateToken(payload: JwtPayload): string;
export declare function verifyToken(token: string): JwtPayload;
//# sourceMappingURL=auth.service.d.ts.map