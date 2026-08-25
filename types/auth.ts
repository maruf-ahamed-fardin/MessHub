import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
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

  interface User {
    role: string;
    memberId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    memberId: string | null;
  }
}
