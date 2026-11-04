
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClientBrowser } from "@/lib/supabase-browser";

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
  table_id: string | null;
  status: string;
  total: number;
  created_at: string;
  table_number: string | number;
  order_items: OrderItem[];
};

type Table = {
  id: string;
  table_number: string | number;
};

const STATUSES: OrderStatus[] = [
  "new",
  "preparing",
  "ready",
  "completed",
];

const STATUS_STYLES: Record<string, string> = {
  new: "bg-orange-100 text-orange-800",
  preparing: "bg-amber-100 text-amber-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-600",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [filter, setFilter] = useState("all");

  const [supabase] = useState(() => createClientBrowser());

  const loadOrders = useCallback(async () => {
    setError("");

    try {
      // Get the currently logged-in user.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please log in to view your orders.");
      }

      // Find the restaurant belonging to this owner.
      const { data: restaurant, error: restaurantError } =
        await supabase
          .from("restaurants")
          .select("id, name")
          .eq("owner_id", user.id)
          .single();

      if (restaurantError || !restaurant) {
        throw new Error(
          restaurantError?.message || "Restaurant not found."
        );
      }

      // Load orders for this restaurant only.
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
            .filter((id): id is string => Boolean(id))
        ),
      ];

      let itemData: OrderItem[] = [];
      let tableData: Table[] = [];

      // Load order items.
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

      // Load table numbers.
      if (tableIds.length > 0) {
        const { data, error: tablesError } = await supabase
          .from("tables")
          .select("id, table_number")
          .in("id", tableIds);

        if (tablesError) throw tablesError;

        tableData = (data || []) as Table[];
      }

      const tableMap = new Map(
        tableData.map((table) => [
          table.id,
          table.table_number,
        ])
      );

      // Group items by order.
      const itemsByOrder = new Map<string, OrderItem[]>();

      for (const item of itemData) {
        const current = itemsByOrder.get(item.order_id) || [];

        current.push(item);

        itemsByOrder.set(item.order_id, current);
      }

      // Combine orders, items and table numbers.
      const combinedOrders: Order[] = fetchedOrders.map((order) => ({
        ...order,
        table_number: order.table_id
          ? tableMap.get(order.table_id) ?? "Unknown"
          : "Unknown",
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
  }, [supabase]);

  // Initial loading and automatic refresh.
  useEffect(() => {
    void loadOrders();

    const interval = window.setInterval(() => {
      void loadOrders();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadOrders]);

  // Update an order's status.
  async function updateStatus(
    orderId: string,
    newStatus: OrderStatus
  ) {
    setUpdatingOrderId(orderId);
    setError("");

    const currentOrder = orders.find(
      (order) => order.id === orderId
    );

    if (!currentOrder) {
      setUpdatingOrderId("");
      return;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .eq("restaurant_id", currentOrder.restaurant_id);

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

  // Filter orders.
  const visibleOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  // Statistics.
  const activeOrders = orders.filter(
    (order) => order.status !== "completed"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const newOrders = orders.filter(
    (order) => order.status === "new"
  ).length;

  // Loading screen.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#EAE3D9] border-t-[#0F5132]" />

          <p className="mt-4 text-sm text-[#777777]">
            Loading your orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* Page heading */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#FF7A00]">
            Order Management
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F5132] sm:text-4xl">
            Orders
          </h1>

          <p className="mt-2 text-sm text-[#777777]">
            Track and manage your restaurant's incoming orders.
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            void loadOrders();
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#0F5132] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#0B3D26] active:scale-[0.98]"
        >
          <span>↻</span>
          Refresh Orders
        </button>
      </header>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#777777]">
              Total Orders
            </span>
            <span className="rounded-xl bg-green-50 p-3 text-xl">
              ▤
            </span>
          </div>

          <p className="mt-5 text-3xl font-extrabold text-[#0F5132]">
            {orders.length}
          </p>

          <p className="mt-2 text-xs text-[#777777]">
            All recorded orders
          </p>
        </div>

        <div className="rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#777777]">
              New Orders
            </span>
            <span className="rounded-xl bg-orange-50 p-3 text-xl">
              ◷
            </span>
          </div>

          <p className="mt-5 text-3xl font-extrabold text-[#FF7A00]">
            {newOrders}
          </p>

          <p className="mt-2 text-xs text-[#777777]">
            Awaiting preparation
          </p>
        </div>

        <div className="rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#777777]">
              Active Orders
            </span>
            <span className="rounded-xl bg-amber-50 p-3 text-xl">
              ◴
            </span>
          </div>

          <p className="mt-5 text-3xl font-extrabold text-amber-600">
            {activeOrders}
          </p>

          <p className="mt-2 text-xs text-[#777777]">
            Currently being processed
          </p>
        </div>

        <div className="rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#777777]">
              Completed Orders
            </span>
            <span className="rounded-xl bg-green-50 p-3 text-xl">
              ✓
            </span>
          </div>

          <p className="mt-5 text-3xl font-extrabold text-[#0F5132]">
            {completedOrders}
          </p>

          <p className="mt-2 text-xs text-[#777777]">
            Successfully fulfilled
          </p>
        </div>
      </section>

      {/* Incoming orders */}
      <section>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-[#1F1F1F]">
              Incoming Orders
            </h2>

            <p className="mt-1 text-sm text-[#777777]">
              Review orders and update their progress.
            </p>
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-[#EAE3D9] bg-white px-4 py-3 text-sm font-medium text-[#1F1F1F] outline-none focus:border-[#0F5132]"
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
          <div className="mt-6 rounded-2xl border border-[#EAE3D9] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF8EF] text-3xl">
              ▤
            </div>

            <h3 className="mt-5 text-lg font-bold text-[#1F1F1F]">
              {orders.length === 0
                ? "No customer orders yet"
                : "No matching orders"}
            </h3>

            <p className="mt-2 text-sm text-[#777777]">
              {orders.length === 0
                ? "New customer orders will appear here."
                : "Try selecting another order status."}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {visibleOrders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-[#EAE3D9] bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Order header */}
                <div className="flex flex-col justify-between gap-4 border-b border-[#EAE3D9] bg-[#FFFDF9] p-5 sm:flex-row sm:items-center sm:px-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
                      Order #{order.id.slice(0, 8)}
                    </p>

                    <h3 className="mt-2 text-xl font-extrabold text-[#0F5132]">
                      Table {order.table_number}
                    </h3>

                    <p className="mt-1 text-sm text-[#777777]">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-4 py-2 text-xs font-bold capitalize ${
                      STATUS_STYLES[order.status] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Order items */}
                <div className="p-5 sm:p-6">
                  <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-[#777777]">
                    Order Items
                  </h4>

                  {order.order_items.length === 0 ? (
                    <p className="text-sm text-[#777777]">
                      No items were found for this order.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1F1F1F]">
                              {item.item_name}
                            </p>

                            <p className="mt-1 text-sm text-[#777777]">
                              {item.quantity} × KSh{" "}
                              {Number(item.unit_price).toFixed(2)}
                            </p>
                          </div>

                          <p className="shrink-0 font-semibold text-[#1F1F1F]">
                            KSh {Number(item.subtotal).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total and status */}
                  <div className="mt-6 flex flex-col justify-between gap-5 border-t border-[#EAE3D9] pt-5 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#777777]">
                        Order Total
                      </p>

                      <p className="mt-2 text-2xl font-extrabold text-[#0F5132]">
                        KSh {Number(order.total).toFixed(2)}
                      </p>
                    </div>

                    <div className="w-full sm:w-60">
                      <label
                        htmlFor={`status-${order.id}`}
                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#777777]"
                      >
                        Update Order Status
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
                        className="w-full rounded-xl border border-[#EAE3D9] bg-[#FFF8EF] px-4 py-3 text-sm font-semibold text-[#0F5132] outline-none transition focus:border-[#0F5132] disabled:opacity-50"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </option>
                        ))}
                      </select>

                      {updatingOrderId === order.id && (
                        <p className="mt-2 text-xs text-[#777777]">
                          Updating status...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
