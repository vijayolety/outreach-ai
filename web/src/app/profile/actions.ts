"use server";

import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

export async function updateProfile(formData: FormData) {
  const user = await getAuthUser();
  const userId = user.id;

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name || !email) return { success: false, error: "Name and email are required" };

  try {
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      return { success: false, error: "Email already in use" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { name, email },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePassword(formData: FormData) {
  const user = await getAuthUser();
  const userId = user.id;

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All password fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New passwords do not match" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      return { success: false, error: "User not found or password login not available" };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Current password is incorrect" };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Password Update Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserImage(image: string) {
  const user = await getAuthUser();
  const userId = user.id;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { image },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Image Update Error:", error);
    return { success: false, error: "Failed to update profile image" };
  }
}

