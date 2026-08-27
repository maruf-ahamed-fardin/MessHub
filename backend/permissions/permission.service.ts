import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

/**
 * Get the current session on the server.
 * Redirects to login if not authenticated.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * Get the current session and require ADMIN role.
 * Throws if not admin.
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required.");
  }
  return session;
}

/**
 * Check if a user is allowed to modify a resource belonging to `ownerId`.
 * Admins can modify anything. Members can only modify their own resources.
 */
export function canModify(session: { user: { id: string; role: string } }, ownerId: string): boolean {
  return session.user.role === "ADMIN" || session.user.id === ownerId;
}

/**
 * Check if a user is allowed to modify a member resource belonging to `memberUserId`.
 */
export function canModifyMember(
  session: { user: { id: string; role: string; memberId?: string | null } },
  targetMemberId: string
): boolean {
  if (!session?.user) return false;
  if (session.user.role === "ADMIN") return true;
  if (session.user.memberId && session.user.memberId === targetMemberId) return true;
  if (session.user.id && session.user.id === targetMemberId) return true;
  return false;
}

/**
 * Throw if the current user cannot modify the given member's data.
 */
export function assertCanModifyMember(
  session: { user: { id: string; role: string; memberId?: string | null } },
  targetMemberId: string
) {
  if (!canModifyMember(session, targetMemberId)) {
    throw new Error("Unauthorized: You cannot modify another member's data.");
  }
}

/**
 * Check if authenticated user is admin.
 */
export function isAdmin(session: { user: { role: string } }): boolean {
  return session.user.role === "ADMIN";
}
