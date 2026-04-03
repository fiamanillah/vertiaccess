// services/auth-service/src/auth.service.ts
import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    ConfirmSignUpCommand,
    InitiateAuthCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { AppLogger } from '@serverless-backend-starter/core';
import { config } from '@serverless-backend-starter/core';

const logger = new AppLogger('AuthService');

// Reuse client across Lambda invocations
const cognitoClient = new CognitoIdentityProviderClient({
    region: config.cognito.region,
});

export class AuthService {
    /**
     * Register a new user in Cognito
     */
    async signUp(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        role: string = 'operator'
    ) {
        logger.info('Registering user in Cognito', { email, role });

        const command = new SignUpCommand({
            ClientId: config.cognito.clientId,
            Username: email,
            Password: password,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'custom:role', Value: role },
                { Name: 'custom:firstName', Value: firstName },
                { Name: 'custom:lastName', Value: lastName },
            ],
        });

        const result = await cognitoClient.send(command);

        logger.info('User registered in Cognito', {
            userSub: result.UserSub,
            confirmed: result.UserConfirmed,
        });

        return {
            userSub: result.UserSub!,
            userConfirmed: result.UserConfirmed || false,
        };
    }

    /**
     * Confirm user sign-up with verification code
     */
    async confirmSignUp(email: string, code: string) {
        logger.info('Confirming sign-up', { email });

        const command = new ConfirmSignUpCommand({
            ClientId: config.cognito.clientId,
            Username: email,
            ConfirmationCode: code,
        });

        await cognitoClient.send(command);
        logger.info('User confirmed successfully', { email });
    }

    /**
     * Sign in a user and return tokens
     */
    async signIn(email: string, password: string) {
        logger.info('Signing in user', { email });

        const command = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: config.cognito.clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        });

        const result = await cognitoClient.send(command);

        if (!result.AuthenticationResult) {
            throw new Error('Authentication failed: no tokens returned');
        }

        logger.info('User signed in successfully', { email });

        return {
            idToken: result.AuthenticationResult.IdToken!,
            accessToken: result.AuthenticationResult.AccessToken!,
            refreshToken: result.AuthenticationResult.RefreshToken!,
            expiresIn: result.AuthenticationResult.ExpiresIn!,
        };
    }

    /**
     * Refresh tokens using a refresh token
     */
    async refreshToken(refreshToken: string) {
        logger.info('Refreshing tokens');

        const command = new InitiateAuthCommand({
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: config.cognito.clientId,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken,
            },
        });

        const result = await cognitoClient.send(command);

        if (!result.AuthenticationResult) {
            throw new Error('Token refresh failed');
        }

        return {
            idToken: result.AuthenticationResult.IdToken!,
            accessToken: result.AuthenticationResult.AccessToken!,
            expiresIn: result.AuthenticationResult.ExpiresIn!,
        };
    }

    /**
     * Initiate forgot password flow
     */
    async forgotPassword(email: string) {
        logger.info('Initiating forgot password', { email });

        const command = new ForgotPasswordCommand({
            ClientId: config.cognito.clientId,
            Username: email,
        });

        await cognitoClient.send(command);
        logger.info('Forgot password code sent', { email });
    }

    /**
     * Reset password with confirmation code
     */
    async resetPassword(email: string, code: string, newPassword: string) {
        logger.info('Resetting password', { email });

        const command = new ConfirmForgotPasswordCommand({
            ClientId: config.cognito.clientId,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword,
        });

        await cognitoClient.send(command);
        logger.info('Password reset successfully', { email });
    }

    /**
     * Resend confirmation code
     */
    async resendConfirmationCode(email: string) {
        logger.info('Resending confirmation code', { email });

        const command = new ResendConfirmationCodeCommand({
            ClientId: config.cognito.clientId,
            Username: email,
        });

        await cognitoClient.send(command);
        logger.info('Confirmation code resent', { email });
    }
}

// Singleton instance for Lambda cold-start reuse
export const authService = new AuthService();
