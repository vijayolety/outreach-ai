// src/modules/auth/auth.service.ts
// Authentication service — user registration, lookup, password verification

import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { RegisterSchema } from "@/schemas/auth.schema";
import type { z } from "zod";

const SALT_ROUNDS = 12;

export const AuthService = {
  async registerUser(data: z.infer<typeof RegisterSchema>) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Email already in use");
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  },

  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },
};