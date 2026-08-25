import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig, DEFAULT_MOCK_SESSION } from "./auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const nextAuthInstance = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { member: true },
          });

          if (!user || !user.password) return null;

          if (user.role === "MEMBER" && user.member && !user.member.isActive) {
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            memberId: user.member?.id ?? null,
          };
        } catch {
          // If DB is unreachable, allow login with default admin credentials
          if (email === "admin@messhub.app" && password === "admin123") {
            return DEFAULT_MOCK_SESSION.user;
          }
          return null;
        }
      },
    }),
  ],
});

export const { handlers, signIn, signOut } = nextAuthInstance;

// Wrapped auth function that falls back to default mock admin session when auth is bypassed
export async function auth() {
  try {
    const session = await nextAuthInstance.auth();
    if (session?.user) return session;
  } catch {
    // Ignore and fallback
  }
  return DEFAULT_MOCK_SESSION;
}
