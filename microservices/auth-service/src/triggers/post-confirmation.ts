// microservices/auth-service/src/triggers/post-confirmation.ts
import { RegistrationService } from '../services/auth/registration.service.ts'
import { AppLogger } from '@vertiaccess/core'

const logger = new AppLogger('PostConfirmationTrigger')

/**
 * AWS Lambda handler for Cognito Post Confirmation event.
 * Triggered automatically after user verifies their email.
 * Creates User, role-specific profile, and welcome notification atomically.
 */
export async function handler(event: any) {
  logger.info('Post-confirmation trigger invoked', {
    userSub: event.request.userAttributes?.sub,
    email: event.request.userAttributes?.email,
  })

  try {
    // Extract user attributes from Cognito event
    const userAttributes = event.request.userAttributes || {}
    const cognitoSub = userAttributes.sub
    const email = userAttributes.email
    const role = userAttributes['custom:role'] || 'operator'
    const firstName = userAttributes['custom:firstName'] || ''
    const lastName = userAttributes['custom:lastName'] || ''

    // Validate required fields
    if (!cognitoSub || !email) {
      logger.error('Missing required attributes in post-confirmation event', {
        cognitoSub,
        email,
      })
      throw new Error('Missing required user attributes (sub, email)')
    }

    // Prepare DTO for registration service
    const createUserDTO = {
      email,
      firstName,
      lastName,
      password: '', // Not needed for post-confirmation
      role: (role.toLowerCase() === 'landowner' ? 'landowner' : 'operator') as
        | 'operator'
        | 'landowner',
      organisation: userAttributes['custom:organisation'] || '',
      contactPhone: userAttributes['custom:contactPhone'] || '',
      flyerId: userAttributes['custom:flyerId'] || '',
      operatorId: userAttributes['custom:operatorId'] || '',
    }

    // Create user and profile based on role
    if (createUserDTO.role === 'landowner') {
      await RegistrationService.registerLandowner(createUserDTO, cognitoSub)
      logger.info('Landowner created successfully', { email, cognitoSub })
    } else {
      await RegistrationService.registerOperator(createUserDTO, cognitoSub)
      logger.info('Operator created successfully', { email, cognitoSub })
    }

    // Return success to Cognito (allows confirmation to proceed)
    return {
      autoConfirmUser: false, // User is already confirmed by reaching this event
      autoVerifiedAttributes: [],
    }
  } catch (error) {
    // Log error but don't fail the trigger—Cognito will still confirm the user
    // The confirm endpoint will catch this via fallback provisioning
    logger.error('Post-confirmation trigger failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Still return success so Cognito doesn't block confirmation
    // Fallback provisioning in the confirm endpoint will handle DB creation
    return {
      autoConfirmUser: false,
      autoVerifiedAttributes: [],
    }
  }
}
