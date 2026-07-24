"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (!user) return null;

  const links = [{ href: "/dashboard", label: "Back Orders" }, { href: "/dashboard/reports", label: "Reports" }];
  if (user.role === "ADMIN" || user.role === "CRO") {
    links.push({ href: "/dashboard/clients", label: "Clients" });
  }
  if (user.role === "ADMIN") {
    links.push({ href: "/dashboard/users", label: "Manage Users" });
    links.push({ href: "/dashboard/suppliers", label: "Suppliers" });
    links.push({ href: "/dashboard/audit-log", label: "Audit Log" });
  }
  if (user.role === "CRO" || user.role === "ADMIN") {
    links.push({ href: "/dashboard/new", label: "New Back Order" });
  }

  return (
    <aside className="w-56 min-h-screen border-r border-[var(--color-steel)]/20 flex flex-col justify-between py-6 px-4">
      <div>
        <p className="text-xs tracking-widest uppercase text-[var(--color-steel)] font-[family-name:var(--font-mono)]">
          Supply Chain Ops
        </p>
        <h1 className="text-xl font-[family-name:var(--font-display)] font-semibold mt-1 mb-8">
          BackOrder
        </h1>

        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "block px-3 py-2 rounded text-sm btn-primary"
                    : "block px-3 py-2 rounded text-sm text-[var(--color-ink)] hover:bg-[var(--color-steel)]/10"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[var(--color-steel)]/20 pt-4">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-[var(--color-steel)] font-[family-name:var(--font-mono)]">{user.role}</p>
        <button
          onClick={handleLogout}
          className="mt-3 text-xs text-[var(--color-rust)] hover:underline"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
