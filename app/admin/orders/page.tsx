import { supabase } from "@/lib/supabase";
import OrderStatusButton from "./OrderStatusButton";

type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
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
  tables: {
    table_number: number;
  } | null;
  order_items: OrderItem[];
};

export default async function CustomerOrdersPage() {
  const { data: restaurant, error: restaurantError } =
    await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", "marks-restaurant")
      .single();

  if (restaurantError || !restaurant) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold">
            Restaurant not found
          </h1>

          <p className="mt-2 text-red-600">
            {restaurantError?.message}
          </p>
        </div>
      </main>
    );
  }

const { data: orders, error: ordersError } =
  await supabase
    .from("orders")
    .select(`
      *,
      tables (
        table_number
      ),
      order_items (
        id,
        order_id,
        menu_item_id,
        item_name,
        quantity,
        unit_price,
        subtotal
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (ordersError) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold">
            Could not load orders
          </h1>

          <p className="mt-2 text-red-600">
            {ordersError.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <header>
          <h1 className="text-3xl font-bold">
            Customer Orders
          </h1>

          <p className="mt-2 text-gray-500">
            {restaurant.name}
          </p>
        </header>

        <div className="mt-8 space-y-4">
          {orders?.length === 0 ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-gray-500">
                No customer orders yet.
              </p>
            </div>
          ) : (
            orders?.map((order: Order) => (
              <div
  key={order.id}
  className="rounded-xl bg-white p-6 shadow-sm"
>
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-xl font-bold">
        Table {order.tables?.table_number ?? "Unknown"}
      </p>

      <p className="mt-1 break-all text-xs text-gray-400">
        Order ID: {order.id}
      </p>
    </div>

    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize">
      {order.status}
    </span>
  </div>

  <div className="mt-5 border-t pt-4">
    <h3 className="font-semibold">
      Items
    </h3>

    <div className="mt-3 space-y-3">
      {order.order_items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between"
        >
          <div>
            <p className="font-medium">
              {item.item_name}
            </p>

            <p className="text-sm text-gray-500">
              KSh {Number(item.unit_price).toFixed(2)} ×{" "}
              {item.quantity}
            </p>
          </div>

          <p className="font-semibold">
            KSh {Number(item.subtotal).toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  </div>

  <div className="mt-5 flex items-center justify-between border-t pt-4">
    <span className="text-lg font-bold">
      Total
    </span>

    <span className="text-xl font-bold">
      KSh {Number(order.total).toFixed(2)}
    </span>
  </div>

  <OrderStatusButton
  orderId={order.id}
  currentStatus={order.status}
/>
</div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}