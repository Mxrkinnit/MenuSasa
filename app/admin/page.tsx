
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClientBrowser } from "@/lib/supabase-browser";

type DashboardStats = {
  totalOrders: number;
  activeOrders: number;
  menuItems: number;
  tables: number;
};

const quickActions = [
  {
    title: "Manage Restaurant",
    description: "Update your restaurant details, categories and menu items.",
    href: "/admin/restaurant",
    icon: "🏪",
    action: "Manage restaurant",
  },
  {
    title: "Manage Orders",
    description: "View incoming orders and update their status.",
    href: "/admin/orders",
    icon: "📋",
    action: "View orders",
  },
  {
    title: "Tables & QR Codes",
    description: "Create dining tables and generate QR codes for customers.",
    href: "/admin/tables",
    icon: "📱",
    action: "Manage tables",
  },
  {
    title: "Analytics",
    description: "Explore your restaurant's performance and sales.",
    href: "/admin/analytics",
    icon: "📊",
    action: "View analytics",
  },
];

export default function AdminPage() {
  const [supabase] = useState(() => createClientBrowser());

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeOrders: 0,
    menuItems: 0,
    tables: 0,
  });

  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("Your Restaurant");
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setError("Please log in to view your restaurant dashboard.");
        return;
      }

      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("owner_id", user.id)
        .single();

      if (restaurantError) throw restaurantError;

      setRestaurantName(restaurant.name);

      const restaurantId = restaurant.id;

      const [
        ordersResult,
        activeOrdersResult,
        menuItemsResult,
        tablesResult,
      ] = await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId),

        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId)
          .in("status", ["new", "preparing", "ready"]),

        supabase
          .from("menu_items")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId),

        supabase
          .from("tables")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId),
      ]);

      const queryError =
        ordersResult.error ||
        activeOrdersResult.error ||
        menuItemsResult.error ||
        tablesResult.error;

      if (queryError) throw queryError;

      setStats({
        totalOrders: ordersResult.count ?? 0,
        activeOrders: activeOrdersResult.count ?? 0,
        menuItems: menuItemsResult.count ?? 0,
        tables: tablesResult.count ?? 0,
      });
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const dashboardCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      description: "All restaurant orders",
      icon: "🧾",
      href: "/admin/orders",
    },
    {
      title: "Active Orders",
      value: stats.activeOrders,
      description: "Orders being processed",
      icon: "🍳",
      href: "/admin/orders",
    },
    {
      title: "Menu Items",
      value: stats.menuItems,
      description: "Your restaurant food items",
      icon: "🍽️",
      href: "/admin/restaurant",
    },
    {
      title: "Tables",
      value: stats.tables,
      description: "Your dining tables",
      icon: "🪑",
      href: "/admin/tables",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0F5132] p-7 text-white shadow-lg sm:p-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Restaurant Dashboard
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Welcome to MenuSasa 👋
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">
            Managing {restaurantName}. Keep track of customer orders,
            organize your menu and grow your business from one place.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/admin/orders"
              className="rounded-xl bg-[#FF7A00] px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              View Orders →
            </Link>

            <Link
              href="/admin/restaurant"
              className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Manage Menu
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[35px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-64 w-64 rounded-full bg-white/5" />
      </section>

      {/* Summary cards */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1F1F1F]">
              Restaurant Overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Your restaurant activity at a glance.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="rounded-lg border border-[#EAE3D9] bg-white px-4 py-2 text-sm font-semibold text-[#0F5132] hover:bg-[#FFF8EF] disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{card.icon}</span>
                <span className="text-sm text-gray-400 transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-5 text-sm font-medium text-gray-500">
                {card.title}
              </p>

              <p className="mt-1 text-3xl font-extrabold text-[#0F5132]">
                {loading ? "..." : card.value}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-[#1F1F1F]">
            Quick Actions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Everything you need to run your restaurant.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex gap-4 rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm transition hover:border-[#0F5132]/30 hover:shadow-md"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1E3] text-2xl">
                {action.icon}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-[#1F1F1F] transition group-hover:text-[#0F5132]">
                  {action.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {action.description}
                </p>

                <p className="mt-4 text-sm font-bold text-[#FF7A00]">
                  {action.action} →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Getting started */}
      <section className="rounded-2xl border border-[#EAE3D9] bg-white p-6 sm:p-8">
        <h2 className="text-lg font-bold text-[#1F1F1F]">
          Getting Started
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Make sure your restaurant is ready to receive customer orders.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link
            href="/admin/restaurant"
            className="rounded-xl bg-[#FFF8EF] p-4 transition hover:bg-[#FFF1E3]"
          >
            <span className="text-2xl">🍔</span>
            <p className="mt-3 font-bold text-[#0F5132]">
              1. Set up your menu
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Add categories, food items and prices.
            </p>
          </Link>

          <Link
            href="/admin/tables"
            className="rounded-xl bg-[#FFF8EF] p-4 transition hover:bg-[#FFF1E3]"
          >
            <span className="text-2xl">📱</span>
            <p className="mt-3 font-bold text-[#0F5132]">
              2. Create QR codes
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Set up tables for customers to scan.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-xl bg-[#FFF8EF] p-4 transition hover:bg-[#FFF1E3]"
          >
            <span className="text-2xl">🛎️</span>
            <p className="mt-3 font-bold text-[#0F5132]">
              3. Manage orders
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Receive and process customer orders.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
