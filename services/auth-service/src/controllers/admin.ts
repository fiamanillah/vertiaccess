import type { Context } from "hono";
import { sendResponse, type CognitoUser } from "@serverless-backend-starter/core";
import { db } from "@serverless-backend-starter/database";

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

  const formatted = verifications.map(v => {
    const profile = v.user?.role === 'OPERATOR' ? v.user.operatorProfile : v.user?.landownerProfile;
    return {
      id: v.id,
      type: v.type,
      status: v.status,
      userId: v.userId,
      userEmail: v.user?.email,
      userName: profile?.fullName,
      userOrganisation: profile?.organisation,
      submittedDocuments: v.submittedDocuments,
      createdAt: v.createdAt,
    };
  });

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

  // If this is an identity verification and it is approved, update user status
  if (verification.type === "identity" && status === "APPROVED") {
    if (verification.userId) {
      await db.user.update({
        where: { id: verification.userId },
        data: { status: "VERIFIED" }
      });
    }
  }

  return sendResponse(c, {
    data: verification,
    message: `Verification ${status.toLowerCase()} successfully`,
  });
}
