import { supabase } from "@/lib/supabase";
import SalesChart from "./SalesChart";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
};

export default async function AnalyticsPage() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, total, status, created_at")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">
            Analytics
          </h1>

          <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-600">
            {error.message}
          </div>
        </div>
      </main>
    );
  }

  const typedOrders = (orders || []) as Order[];

  const totalOrders = typedOrders.length;

  const totalSales = typedOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  const completedOrders = typedOrders.filter(
    (order) => order.status === "completed"
  ).length;

  const pendingOrders = typedOrders.filter(
    (order) =>
      order.status === "new" ||
      order.status === "preparing" ||
      order.status === "ready"
  ).length;

  const salesByDay: Record<string, number> = {};

  for (let i = 6; i >= 0; i--) {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const key = date.toISOString().slice(0, 10);

    salesByDay[key] = 0;
  }

  typedOrders.forEach((order) => {
    const date = new Date(order.created_at);
    const key = date.toISOString().slice(0, 10);

    if (key in salesByDay) {
      salesByDay[key] += Number(order.total);
    }
  });

  

  const salesChartData = Object.entries(salesByDay).map(
    ([date, sales]) => ({
      date: new Date(`${date}T00:00:00`).toLocaleDateString(
        "en-US",
        {
          weekday: "short",
        }
      ),
      sales,
    })
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">
          Analytics
        </h1>

        <p className="mt-2 text-gray-500">
          Overview of your restaurant's performance.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Sales
            </p>

            <p className="mt-2 text-3xl font-bold">
              KSh {totalSales.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Orders
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalOrders}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Completed Orders
            </p>

            <p className="mt-2 text-3xl font-bold">
              {completedOrders}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Active Orders
            </p>

            <p className="mt-2 text-3xl font-bold">
              {pendingOrders}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Sales — Last 7 Days
          </h2>

          <div className="mt-6">
            <SalesChart data={salesChartData} />
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Recent Orders
          </h2>

          {typedOrders.length === 0 ? (
            <p className="mt-4 text-gray-500">
              No orders yet.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {typedOrders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <p className="font-semibold">
                      Order #{order.id.slice(0, 8)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(
                        order.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      KSh {Number(order.total).toFixed(2)}
                    </p>

                    <p className="mt-1 text-sm capitalize text-gray-500">
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}