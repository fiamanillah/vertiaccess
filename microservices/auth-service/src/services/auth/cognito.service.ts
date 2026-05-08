// microservices/auth-service/src/services/auth/cognito.service.ts
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { config } from '@vertiaccess/core';

const client = new CognitoIdentityProviderClient({
    region: config.cognito.region,
});

export class CognitoService {
    static async adminCreateUser(email: string, attributes: { Name: string; Value: string }[]) {
        const command = new AdminCreateUserCommand({
            UserPoolId: config.cognito.userPoolId,
            Username: email,
            UserAttributes: attributes,
            MessageAction: 'SUPPRESS',
        });
        return client.send(command);
    }

    static async adminSetPassword(email: string, password: string) {
        const command = new AdminSetUserPasswordCommand({
            UserPoolId: config.cognito.userPoolId,
            Username: email,
            Password: password,
            Permanent: true,
        });
        return client.send(command);
    }

    static async adminUpdateUserAttributes(email: string, attributes: { Name: string; Value: string }[]) {
        const command = new AdminUpdateUserAttributesCommand({
            UserPoolId: config.cognito.userPoolId,
            Username: email,
            UserAttributes: attributes,
        });
        return client.send(command);
    }
}

export const cognitoService = new CognitoService();
