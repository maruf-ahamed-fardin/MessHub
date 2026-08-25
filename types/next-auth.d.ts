import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    memberId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      memberId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    memberId: string | null;
  }
}
