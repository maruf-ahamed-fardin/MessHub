import type { NextAuthConfig } from "next-auth";

export const DEFAULT_MOCK_USER = {
  id: "cmt8ki8ht000034v30e8sczxh",
  name: "Admin (You)",
  email: "admin@messhub.app",
  image: null,
  role: "ADMIN",
  memberId: "admin-member-1",
};

export const DEFAULT_MOCK_SESSION = {
  user: DEFAULT_MOCK_USER,
  expires: "2099-01-01T00:00:00.000Z",
};

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname.startsWith("/login");
      const isPublic =
        isOnLoginPage ||
        nextUrl.pathname.startsWith("/_next") ||
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname.startsWith("/favicon.ico") ||
        nextUrl.pathname.startsWith("/icons") ||
        nextUrl.pathname.startsWith("/sw.js") ||
        nextUrl.pathname.startsWith("/manifest");

      if (isOnLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && !isPublic) {
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.memberId = (user as any).memberId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.memberId = token.memberId as string | null;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
