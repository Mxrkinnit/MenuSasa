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

        const storageKey = `menusasa_orders_${restaurantSlug}`;

        const storedOrderIds = JSON.parse(
          localStorage.getItem(storageKey) || "[]"
        ) as string[];

        const { data: table, error: tableError } = await supabase
          .from("tables")
          .select("id, qr_token")
          .eq("table_number", currentTableNumber)
          .maybeSingle();

        if (tableError) {
          setError(tableError.message);
          setLoading(false);
          return;
        }

        if (!table) {
          setError("Table not found.");
          setLoading(false);
          return;
        }

        const tableId = table.id;

        if (storedOrderIds.length === 0) {
          setLoading(false);
          return;
        }

        const { data, error: ordersError } = await supabase
          .from("orders")
          .select(`
            id,
            status,
            total,
            created_at,
            table_id,
            qr_token,
            order_items (
              id,
              item_name,
              quantity,
              unit_price,
              subtotal
            )
          `)
          .in("id", storedOrderIds)
          .eq("table_id", tableId)
          .eq("qr_token", table.qr_token)
          .order("created_at", {
            ascending: false,
          });

        if (ordersError) {
          setError(ordersError.message);
          setLoading(false);
          return;
        }

        setOrders((data as Order[]) || []);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load orders."
        );

        setLoading(false);
      }
    }

    loadOrders();
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold">
            My Orders
          </h1>

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
          <h1 className="text-3xl font-bold">
            My Orders
          </h1>

          <a
            href={`/menu/${restaurantSlug}/table/${tableNumber}`}
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
            <p className="text-gray-500">
              No orders found.
            </p>
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
                  <p className="text-sm text-gray-500">
                    Order
                  </p>

                  <p className="mt-1 font-mono text-sm">
                    #{order.id.slice(0, 8)}
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold capitalize">
                  {order.status}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {item.item_name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.quantity} × KSh{" "}
                        {item.unit_price}
                      </p>
                    </div>

                    <p className="font-semibold">
                      KSh {item.subtotal.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <span className="text-lg font-bold">
                  Total
                </span>

                <span className="text-xl font-bold">
                  KSh {order.total.toFixed(2)}
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