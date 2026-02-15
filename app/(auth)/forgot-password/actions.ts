"use server";

import { z } from "zod";
import {
  requestPasswordReset,
  resetPasswordWithToken,
} from "@/lib/password-reset";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[0-9]/, "Password must include a number")
      .regex(/[^a-zA-Z0-9]/, "Password must include a special character"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordActionState = {
  status: "idle" | "success" | "failed" | "invalid_data";
};

export async function submitForgotPassword(
  _: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  try {
    const validatedData = forgotPasswordSchema.parse({
      email: formData.get("email"),
    });

    await requestPasswordReset(validatedData.email);

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
}

export type ResetPasswordActionState = {
  status: "idle" | "success" | "failed" | "invalid_data" | "invalid_token";
};

export async function submitResetPassword(
  _: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> {
  try {
    const validatedData = resetPasswordSchema.parse({
      token: formData.get("token"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const result = await resetPasswordWithToken({
      token: validatedData.token,
      newPassword: validatedData.newPassword,
    });

    if (!result.ok) {
      return { status: "invalid_token" };
    }

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
}
