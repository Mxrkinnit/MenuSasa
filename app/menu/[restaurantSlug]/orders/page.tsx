
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

type PageProps = {
  params: Promise<{
    restaurantSlug: string;
  }>;
};

export default function OrdersPage({ params }: PageProps) {
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const { restaurantSlug } = await params;

        const searchParams = new URLSearchParams(
          window.location.search
        );

        const currentTableNumber =
          searchParams.get("table") || "";

        setRestaurantSlug(restaurantSlug);
        setTableNumber(currentTableNumber);

        if (!currentTableNumber) {
          setError("Table number is missing.");
          setLoading(false);
          return;
        }

        const storageKey = `menusasa_orders_${restaurantSlug}`;

        const storedOrderIds = JSON.parse(
          localStorage.getItem(storageKey) || "[]"
        ) as string[];

        // Find the restaurant using its URL slug.
        const { data: restaurant, error: restaurantError } =
          await supabase
            .from("restaurants")
            .select("id")
            .eq("slug", restaurantSlug)
            .single();

        if (restaurantError || !restaurant) {
          setError("Restaurant not found.");
          setLoading(false);
          return;
        }

        // Validate the table using its QR token.
        const qrToken = searchParams.get("token") || "";

        if (!qrToken || qrToken.length > 100) {
          setError("Invalid QR code.");
          setLoading(false);
          return;
        }

        const { data: tables, error: tableError } =
          await supabase.rpc("get_public_table", {
            p_restaurant_id: restaurant.id,
            p_table_number: Number(currentTableNumber),
            p_qr_token: qrToken,
          });

        const table = tables?.[0];

        if (tableError || !table) {
          setError("Invalid table QR code.");
          setLoading(false);
          return;
        }

        if (storedOrderIds.length === 0) {
          setLoading(false);
          return;
        }

        // Retrieve only this table's locally recorded orders.
        const { data, error: ordersError } =
          await supabase.rpc("get_customer_orders", {
            p_table_id: table.id,
            p_qr_token: qrToken,
            p_order_ids: storedOrderIds,
          });

        if (ordersError) {
          setError(ordersError.message);
          setLoading(false);
          return;
        }

        setOrders((data as Order[]) || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load orders."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-menusasa-cream px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-5 h-12 w-12 animate-pulse rounded-full bg-green-100" />

            <h1 className="text-2xl font-extrabold text-menusasa-green">
              My Orders
            </h1>

            <p className="mt-3 text-gray-500">
              Loading your orders...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-menusasa-cream px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* PAGE HEADER */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-menusasa-orange">
              MenuSasa
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-menusasa-charcoal">
              My Orders
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Track your orders and see what you ordered.
            </p>
          </div>

          <a
            href={`/menu/${restaurantSlug}/table/${tableNumber}?token=${encodeURIComponent(
              new URLSearchParams(
                typeof window !== "undefined"
                  ? window.location.search
                  : ""
              ).get("token") || ""
            )}`}
            className="shrink-0 rounded-xl bg-menusasa-green px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
          >
            Home
          </a>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-menusasa-red"
          >
            {error}
          </div>
        )}

        {/* EMPTY ORDER HISTORY */}
        {!error && orders.length === 0 && (
          <div className="rounded-3xl bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-menusasa-cream text-4xl">
              🧾
            </div>

            <h2 className="mt-5 text-xl font-bold text-menusasa-charcoal">
              No orders yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your orders will appear here once you've
              placed an order.
            </p>
          </div>
        )}

        {/* ORDER CARDS */}
        <div className="space-y-5">
          {orders.map((order) => {
            const status = order.status.toLowerCase();

            const statusClass =
              status === "completed" ||
              status === "delivered"
                ? "bg-green-50 text-menusasa-green"
                : status === "cancelled" ||
                    status === "canceled"
                  ? "bg-red-50 text-menusasa-red"
                  : status === "pending" ||
                      status === "preparing"
                    ? "bg-orange-50 text-orange-700"
                    : "bg-gray-100 text-gray-700";

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
              >
                {/* ORDER HEADER */}
                <div className="flex items-start justify-between gap-3 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Order
                    </p>

                    <p className="mt-1 font-mono text-sm font-bold text-menusasa-charcoal">
                      #{order.id.slice(0, 8)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-2 text-xs font-bold capitalize ${statusClass}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* ORDER ITEMS */}
                <div className="space-y-4 px-5 pb-5 sm:px-6">
                  {(order.order_items || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-menusasa-charcoal">
                          {item.item_name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {item.quantity} × KSh{" "}
                          {Number(item.unit_price).toFixed(2)}
                        </p>
                      </div>

                      <p className="shrink-0 text-right font-bold text-menusasa-green">
                        KSh{" "}
                        {Number(item.subtotal).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ORDER TOTAL */}
                <div className="border-t border-gray-100 bg-menusasa-cream px-5 py-5 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-menusasa-charcoal">
                      Total
                    </span>

                    <span className="text-xl font-extrabold text-menusasa-green">
                      KSh {Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
