import { db } from '@vertiaccess/database';
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

async function seedAdmin() {
    console.log('🌱 Starting admin seed check...');

    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPassword123!';
    const firstName = process.env.DEFAULT_ADMIN_FIRST_NAME || 'System';
    const lastName = process.env.DEFAULT_ADMIN_LAST_NAME || 'Admin';
    const userPoolId = process.env.COGNITO_USER_POOL_ID || 'us-east-2_BSPxM2adj';

    if (!email || !password) {
        console.warn(
            '⚠️ DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD is not set. Skipping admin seed.'
        );
        return;
    }

    if (!userPoolId) {
        console.error('❌ COGNITO_USER_POOL_ID is not set in environment.');
        process.exit(1);
    }

    try {
        // Check if the admin already exists in the database
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log(`✅ Default admin (${email}) already exists in the database.`);
            return;
        }

        console.log(`👤 Creating default admin in Cognito: ${email}`);

        const cognitoClient = new CognitoIdentityProviderClient({});

        // 1. Create User in Cognito
        const createCommand = new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'true' },
                { Name: 'custom:role', Value: 'admin' },
                { Name: 'custom:firstName', Value: firstName },
                { Name: 'custom:lastName', Value: lastName },
            ],
            MessageAction: 'SUPPRESS', // Do not send temporary password email
        });

        let userSub: string;

        try {
            const createResponse = await cognitoClient.send(createCommand);
            const subAttribute = createResponse.User?.Attributes?.find(
                (attr: any) => attr.Name === 'sub'
            );

            if (!subAttribute?.Value) {
                throw new Error('Could not retrieve user SUB from Cognito response.');
            }
            userSub = subAttribute.Value;

            // 2. Set Permanent Password
            const setPasswordCommand = new AdminSetUserPasswordCommand({
                UserPoolId: userPoolId,
                Username: email,
                Password: password,
                Permanent: true,
            });

            await cognitoClient.send(setPasswordCommand);
            console.log('🔑 Permanent password set for default admin.');
        } catch (cognitoError: any) {
            if (cognitoError.name === 'UsernameExistsException') {
                console.log(`⚠️ User already exists in Cognito. Attempting to sync to database.`);
                console.error(
                    'User exists in Cognito but not in the database. Please clean up Cognito or sync manually.'
                );
                process.exit(1);
            }
            throw cognitoError;
        }

        // 3. Create User in Prisma
        console.log(`💾 Inserting default admin into the database...`);
        await db.$transaction(async (tx: any) => {
            await tx.user.create({
                data: {
                    id: userSub,
                    email,
                    role: 'ADMIN',
                    status: 'VERIFIED',
                },
            });
        });

        console.log(`🎉 Successfully created default admin user: ${email}`);
    } catch (error) {
        console.error('❌ Failed to seed default admin:', error);
        process.exit(1);
    }
}

seedAdmin()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
