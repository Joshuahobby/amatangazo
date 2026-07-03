import Link from "next/link";

import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <nav style={{ display: "flex", gap: 16, padding: 16, borderBottom: "1px solid #ddd" }}>
        <Link href="/admin">Admin</Link>
        <Link href="/admin/moderation">Moderation</Link>
        <Link href="/admin/pricing">Pricing</Link>
        <Link href="/admin/referrals">Referrals</Link>
        <Link href="/admin/umucyo">Umucyo</Link>
        <Link href="/admin/notifications">Notifications</Link>
        <Link href="/admin/tender-summaries">AI Summaries</Link>
        <Link href="/admin/verification">Verification</Link>
      </nav>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
