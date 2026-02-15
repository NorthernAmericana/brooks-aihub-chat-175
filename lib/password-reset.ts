import "server-only";

import {
  createPasswordResetToken,
  getPasswordResetTokenByHash,
  getUser,
  markPasswordResetTokenUsed,
  updateUserPassword,
} from "@/lib/db/queries";
import { generateHashedPassword } from "@/lib/db/utils";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetTokenUsable,
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
} from "@/lib/password-reset-utils";

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;

  if (!resendApiKey || !from) {
    console.info("[password-reset] Email provider not configured", {
      email,
      resetUrl,
    });
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your Brooks AI Hub password",
      text: `Use this link to reset your password: ${resetUrl}`,
    }),
  });
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [existingUser] = await getUser(normalizedEmail);

  if (!existingUser) {
    return;
  }

  const rawToken = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000
  );

  await createPasswordResetToken({
    userId: existingUser.id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${getSiteUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;

  await sendPasswordResetEmail({
    email: normalizedEmail,
    resetUrl,
  });
}

export async function resetPasswordWithToken({
  token,
  newPassword,
}: {
  token: string;
  newPassword: string;
}) {
  const tokenHash = hashPasswordResetToken(token);
  const tokenRecord = await getPasswordResetTokenByHash({ tokenHash });

  if (!tokenRecord || !isPasswordResetTokenUsable(tokenRecord)) {
    return { ok: false as const, reason: "invalid_token" as const };
  }

  const now = new Date();
  const consumedToken = await markPasswordResetTokenUsed({
    tokenId: tokenRecord.id,
    now,
  });

  if (!consumedToken) {
    return { ok: false as const, reason: "invalid_token" as const };
  }

  await updateUserPassword({
    userId: tokenRecord.userId,
    hashedPassword: generateHashedPassword(newPassword),
  });

  return { ok: true as const };
}
