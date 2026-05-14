/**
 * Authentication and User Registration Types
 */

export type UserRole = 'operator' | 'landowner' | 'admin';

export interface RegisterRequest {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: UserRole;
    organisation?: string;
    flyerId?: string;
    operatorId?: string;
    contactPhone?: string;
}

export interface RegisterResponse {
    success: boolean;
    data: {
        userSub: string;
        userConfirmed: boolean;
    };
    message: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    data: {
        accessToken: string;
        idToken: string;
        refreshToken: string;
        expiresIn: number;
    };
    message: string;
}

export interface ConfirmRequest {
    email: string;
    code: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: any;
}
