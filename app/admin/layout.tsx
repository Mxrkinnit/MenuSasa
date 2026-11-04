
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Overview",
    href: "/admin",
    icon: "⌂",
  },
  {
    name: "Restaurant",
    href: "/admin/restaurant",
    icon: "▦",
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: "▤",
  },
  {
    name: "Tables & QR Codes",
    href: "/admin/tables",
    icon: "▧",
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: "▥",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FFF8EF] md:flex">
      {/* Sidebar */}
      <aside className="flex w-full flex-col bg-[#0F5132] text-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">

        {/* Branding */}
        <div className="border-b border-white/15 px-6 py-7">
          <h1 className="text-2xl font-extrabold tracking-tight">
            MenuSasa<span className="text-[#FF7A00]">.</span>
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Restaurant Management
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex gap-2 overflow-x-auto p-4 md:flex-1 md:flex-col">
          <p className="hidden px-3 pb-3 text-xs font-semibold uppercase tracking-widest text-white/50 md:block">
            Main Menu
          </p>

          {navigation.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-white text-[#0F5132] shadow-md"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="hidden border-t border-white/15 p-5 md:block">
          <p className="text-sm font-semibold">MenuSasa Admin</p>
          <p className="mt-1 text-xs text-white/50">
            Manage your restaurant
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[#EAE3D9] bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
              Management Portal
            </p>
            <p className="mt-1 font-semibold text-[#1F1F1F]">
              Welcome to MenuSasa
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F5132] font-bold text-white">
            M
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
