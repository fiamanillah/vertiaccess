import type { Context } from "hono";
import { sendResponse, type CognitoUser } from "@serverless-backend-starter/core";
import { db } from "@serverless-backend-starter/database";
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.APP_AWS_REGION || process.env.AWS_REGION || 'us-east-2',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'site-documents-398069593036-us-east-2';

export async function listUsersHandler(c: Context) {
  const users = await db.user.findMany({
    include: {
      operatorProfile: true,
      landownerProfile: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedUsers = users.map(user => {
    const profile = user.role === 'OPERATOR' ? user.operatorProfile : user.landownerProfile;
    return {
      id: user.id,
      email: user.email,
      role: user.role.toLowerCase(),
      name: profile?.fullName || '',
      organisation: profile?.organisation || '',
      verificationStatus: user.status,
      verifiedDate: user.createdAt, // Or a specific verified date if tracked
      activeSites: 0,
      totalBookings: 0,
    };
  });

  return sendResponse(c, {
    data: formattedUsers,
    message: "Users retrieved successfully"
  });
}

export async function listVerificationsHandler(c: Context) {
  const verifications = await db.verification.findMany({
    include: {
      user: {
        include: {
          operatorProfile: true,
          landownerProfile: true,
        }
      },
      site: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const formatted = await Promise.all(verifications.map(async (v) => {
    const profile = v.user?.role === 'OPERATOR' ? v.user.operatorProfile : v.user?.landownerProfile;
    
    // Generate presigned URLs for submitted documents
    let formattedDocs: any[] = [];
    if (Array.isArray(v.submittedDocuments)) {
      formattedDocs = await Promise.all(
        v.submittedDocuments.map(async (doc: any) => {
          if (doc.fileKey) {
            try {
              const command = new GetObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: doc.fileKey,
              });
              const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
              return { ...doc, downloadUrl };
            } catch (e) {
              console.error("Failed to generate presigned URL for key:", doc.fileKey, e);
              return doc;
            }
          }
          return doc;
        })
      );
    }
    
    return {
      id: v.id,
      type: v.type,
      status: v.status,
      userId: v.userId,
      userEmail: v.user?.email,
      userName: profile?.fullName,
      userOrganisation: profile?.organisation,
      submittedDocuments: formattedDocs.length > 0 ? formattedDocs : null,
      createdAt: v.createdAt,
    };
  }));

  return sendResponse(c, {
    data: formatted,
    message: "Verifications retrieved successfully"
  });
}

export async function updateVerificationHandler(c: Context) {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { status } = body;

  const verification = await db.verification.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
    }
  });

  // If this is an identity verification and it is approved, update user status to VERIFIED
  if (verification.type === "identity" && status === "APPROVED") {
    if (verification.userId) {
      await db.user.update({
        where: { id: verification.userId },
        data: { status: "VERIFIED" }
      });
    }
  }

  // If this is an identity verification and it is rejected, reset user status to UNVERIFIED
  // so the landowner can re-upload documents and try again
  if (verification.type === "identity" && status === "REJECTED") {
    if (verification.userId) {
      await db.user.update({
        where: { id: verification.userId },
        data: { status: "UNVERIFIED" }
      });
    }
  }

  return sendResponse(c, {
    data: verification,
    message: `Verification ${status.toLowerCase()} successfully`,
  });
}
