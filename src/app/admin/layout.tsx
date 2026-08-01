import Link from "next/link";

import { requireAdmin } from "@/lib/admin";

const links = [
  { href: "/admin", label: "Admin" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/ads", label: "Ads" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/umucyo", label: "Umucyo" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/tender-summaries", label: "AI Summaries" },
  { href: "/admin/verification", label: "Verification" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <nav className="flex flex-wrap gap-1 border-b border-border bg-surface px-4 py-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
