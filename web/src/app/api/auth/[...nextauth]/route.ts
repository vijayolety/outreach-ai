// src/app/api/auth/[...nextauth]/route.ts
// Thin NextAuth handler — all config lives in lib/auth.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };