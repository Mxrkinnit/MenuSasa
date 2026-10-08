import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  restaurant_id: string;
  table_id: string;
  status: string;
  total: number;
  created_at: string;
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
    .select("*")
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
                    <p className="text-lg font-bold">
                      Order
                    </p>

                    <p className="mt-1 break-all text-sm text-gray-400">
                      {order.id}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize">
                    {order.status}
                  </span>
                </div>

                <div className="mt-5 border-t pt-4">
                  <p className="text-sm text-gray-500">
                    Total
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    KSh {Number(order.total).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}