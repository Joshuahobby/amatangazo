import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) notFound();
  return user;
}
