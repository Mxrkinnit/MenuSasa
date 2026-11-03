
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

        // Find the table within that restaurant.
        // Validate the table using its QR token.
const qrToken = searchParams.get("token") || "";

if (!qrToken || qrToken.length > 100) {
  setError("Invalid QR code.");
  setLoading(false);
  return;
}

const { data: tables, error: tableError } = await supabase.rpc(
  "get_public_table",
  {
    p_restaurant_id: restaurant.id,
    p_table_number: Number(currentTableNumber),
    p_qr_token: qrToken,
  }
);

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
        const { data, error: ordersError } = await supabase.rpc(
          "get_customer_orders",
          {
            p_table_id: table.id,
            p_qr_token: qrToken,
            p_order_ids: storedOrderIds,
          }
        );

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
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="mt-4 text-gray-500">
            Loading your orders...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">My Orders</h1>

          <a
            href={`/menu/${restaurantSlug}/table/${tableNumber}?token=${encodeURIComponent(
  new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  ).get("token") || ""
)}`}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
          >
            Home
          </a>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">No orders found.</p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Order</p>
                  <p className="mt-1 font-mono text-sm">
                    #{order.id.slice(0, 8)}
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold capitalize">
                  {order.status}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {(order.order_items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {item.item_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × KSh {item.unit_price}
                      </p>
                    </div>

                    <p className="font-semibold">
                      KSh {Number(item.subtotal).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-bold">
                  KSh {Number(order.total).toFixed(2)}
                </span>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
