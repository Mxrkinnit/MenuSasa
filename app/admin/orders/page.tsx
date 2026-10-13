
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderStatus = "new" | "preparing" | "ready" | "completed";

type OrderItem = {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type Order = {
  id: string;
  restaurant_id: string;
  table_id: string;
  status: string;
  total: number;
  created_at: string;
  table_number: string | number;
  order_items: OrderItem[];
};

const STATUSES: OrderStatus[] = [
  "new",
  "preparing",
  "ready",
  "completed",
];

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  preparing: "bg-amber-100 text-amber-800",
  ready: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-100 text-gray-700",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [filter, setFilter] = useState("all");

  const loadOrders = useCallback(async () => {
    setError("");

    try {
      const { data: restaurant, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select("id, name")
          .eq("slug", "marks-restaurant")
          .single();

      if (restaurantError || !restaurant) {
        throw new Error(
          restaurantError?.message || "Restaurant not found."
        );
      }

      const { data: orderData, error: ordersError } =
        await supabase
          .from("orders")
          .select(
            "id, restaurant_id, table_id, status, total, created_at"
          )
          .eq("restaurant_id", restaurant.id)
          .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const fetchedOrders = orderData || [];
      const orderIds = fetchedOrders.map((order) => order.id);
      const tableIds = [
        ...new Set(
          fetchedOrders
            .map((order) => order.table_id)
            .filter(Boolean)
        ),
      ];

      let itemData: OrderItem[] = [];
      let tableData: { id: string; table_number: string | number }[] =
        [];

      if (orderIds.length > 0) {
        const { data, error: itemsError } = await supabase
          .from("order_items")
          .select(
            "id, order_id, item_name, quantity, unit_price, subtotal"
          )
          .in("order_id", orderIds);

        if (itemsError) throw itemsError;
        itemData = (data || []) as OrderItem[];
      }

      if (tableIds.length > 0) {
        const { data, error: tablesError } = await supabase
          .from("tables")
          .select("id, table_number")
          .in("id", tableIds);

        if (tablesError) throw tablesError;
        tableData = data || [];
      }

      const tableMap = new Map(
        tableData.map((table) => [
          table.id,
          table.table_number,
        ])
      );

      const itemsByOrder = new Map<string, OrderItem[]>();

      for (const item of itemData) {
        const current = itemsByOrder.get(item.order_id) || [];
        current.push(item);
        itemsByOrder.set(item.order_id, current);
      }

      const combinedOrders: Order[] = fetchedOrders.map((order) => ({
        ...order,
        table_number: tableMap.get(order.table_id) ?? "Unknown",
        order_items: itemsByOrder.get(order.id) || [],
      }));

      setOrders(combinedOrders);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();

    // Refresh incoming orders automatically every 15 seconds.
    const interval = window.setInterval(() => {
      void loadOrders();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadOrders]);

  async function updateStatus(
    orderId: string,
    newStatus: OrderStatus
  ) {
    setUpdatingOrderId(orderId);
    setError("");

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (updateError) {
      setError(`Could not update order: ${updateError.message}`);
      setUpdatingOrderId("");
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );

    setUpdatingOrderId("");
  }

  const visibleOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  const activeOrders = orders.filter(
    (order) => order.status !== "completed"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">Admin Orders</h1>
          <p className="mt-4 text-gray-500">Loading orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Orders</h1>
            <p className="mt-2 text-gray-500">
              Manage incoming orders for Marks Restaurant.
            </p>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              void loadOrders();
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium hover:bg-gray-100"
          >
            Refresh Orders
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="mt-2 text-3xl font-bold">{orders.length}</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Orders</p>
            <p className="mt-2 text-3xl font-bold">{activeOrders}</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Completed Orders</p>
            <p className="mt-2 text-3xl font-bold">
              {orders.filter((o) => o.status === "completed").length}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold">Incoming Orders</h2>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-3"
              aria-label="Filter orders by status"
            >
              <option value="all">All orders</option>
              <option value="new">New</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {visibleOrders.length === 0 ? (
            <div className="mt-5 rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">
                {orders.length === 0
                  ? "No customer orders yet."
                  : "No orders match this filter."}
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {visibleOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-xl bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Order #{order.id.slice(0, 8)}
                      </p>

                      <h3 className="mt-2 text-xl font-bold">
                        Table {order.table_number}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${
                        STATUS_STYLES[order.status] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="py-5">
                    <h4 className="mb-4 font-semibold">Order Items</h4>

                    {order.order_items.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No items were found for this order.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="font-medium">
                                {item.item_name}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {item.quantity} × KSh{" "}
                                {Number(item.unit_price).toFixed(2)}
                              </p>
                            </div>

                            <p className="shrink-0 font-semibold">
                              KSh {Number(item.subtotal).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Order Total
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        KSh {Number(order.total).toFixed(2)}
                      </p>
                    </div>

                    <div className="w-full sm:w-56">
                      <label
                        htmlFor={`status-${order.id}`}
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Update Status
                      </label>

                      <select
                        id={`status-${order.id}`}
                        value={
                          STATUSES.includes(order.status as OrderStatus)
                            ? order.status
                            : "new"
                        }
                        disabled={updatingOrderId === order.id}
                        onChange={(event) =>
                          void updateStatus(
                            order.id,
                            event.target.value as OrderStatus
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 disabled:opacity-50"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </option>
                        ))}
                      </select>

                      {updatingOrderId === order.id && (
                        <p className="mt-2 text-sm text-gray-500">
                          Updating status...
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
