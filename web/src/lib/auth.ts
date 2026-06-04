// src/lib/auth.ts
// Canonical NextAuth configuration and reusable auth helper.
// All auth config lives here — the route file is a thin handler only.

import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { AuthService } from "@/modules/auth/auth.service";

// ---------------------------------------------------------------------------
// NextAuth Configuration
// ---------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  debug: process.env.NODE_ENV === "development",

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await AuthService.getUserByEmail(credentials.email);

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        const isValid = await AuthService.verifyPassword(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Minimal payload
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        // Image is optionally stored in DB but we keep JWT slim
        session.user.image = null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// ---------------------------------------------------------------------------
// Auth Helper — reusable in Server Components, Server Actions, API Routes
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Gets the authenticated user or throws "Unauthorized".
 * Use in server components, server actions, and API routes.
 *
 * @throws Error("Unauthorized") if no valid session
 */
export async function getAuthUser(): Promise<AuthUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
  };
}