import { handle } from 'hono/aws-lambda';
import { createServiceApp, sendResponse } from '@vertiaccess/core';

// Create a Hono app with all global middleware pre-configured
const app = createServiceApp({
    serviceName: 'test-service',
    basePath: '/test/v1',
});

import type { Context } from 'hono';

// Add a simple test route
app.get('/test/v1/ping', (c: Context) => {
    return sendResponse(c, {
        message: 'pong',
        data: {
            status: 'working'
        }
    });
});

// Export the Lambda handler
export const handler = handle(app);
