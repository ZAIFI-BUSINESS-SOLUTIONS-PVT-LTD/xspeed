"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, getUser, clearAuth } from "@/lib/auth";

const NAV = [
  { href: "/admin",           label: "Dashboard" },
  { href: "/admin/teams",     label: "Teams"     },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/payments",  label: "Payments"  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Admin login page renders inside this layout — let it through without auth
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }
    if (!isAuthenticated()) {
      router.replace("/admin/login");
      return;
    }
    const user = getUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading admin panel…</p>
      </div>
    );
  }

  const user = getUser();

  function handleLogout() {
    clearAuth();
    router.replace("/admin/login");
  }

  // Admin login page: render bare (no nav shell)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top nav */}
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-red-600 font-bold text-lg tracking-wide">XSPEED Admin</span>
            <nav className="flex gap-1">
              {NAV.map(({ href, label }) => {
                const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      active
                        ? "bg-zinc-800 text-white"
                        : "text-gray-400 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{user?.email}</span>
            <span className="text-xs bg-red-900/40 text-red-400 border border-red-800/40 px-2 py-0.5 rounded capitalize">
              {user?.role?.replace("_", " ")}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
