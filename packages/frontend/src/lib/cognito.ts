// src/lib/cognito.ts
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { getApiBaseUrl } from './api';

const COGNITO_USER_POOL_ID = (import.meta as any).env.VITE_COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = (import.meta as any).env.VITE_COGNITO_CLIENT_ID || '';

if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
    console.warn(
        'Cognito configuration missing. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID in your .env.local file.'
    );
}

export const userPool = new CognitoUserPool({
    UserPoolId: COGNITO_USER_POOL_ID,
    ClientId: COGNITO_CLIENT_ID,
});

export const API_BASE_URL = getApiBaseUrl();
