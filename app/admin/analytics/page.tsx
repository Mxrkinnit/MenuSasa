
import { createClientServer } from "@/lib/supabase-server";
import SalesChart from "./SalesChart";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
};

const currency = (amount: number) =>
  `KSh ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const statusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "preparing":
      return "bg-orange-100 text-orange-700";
    case "ready":
      return "bg-blue-100 text-blue-700";
    case "new":
      return "bg-purple-100 text-purple-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default async function AnalyticsPage() {
  const supabase = await createClientServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0F5132]">
          Analytics
        </h1>
        <p className="mt-4 text-red-600">
          Please sign in to view analytics.
        </p>
      </div>
    );
  }

  const { data: restaurant, error: restaurantError } =
    await supabase
      .from("restaurants")
      .select("id, name")
      .eq("owner_id", user.id)
      .maybeSingle();

  if (restaurantError || !restaurant) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0F5132]">
          Analytics
        </h1>
        <p className="mt-4 text-red-600">
          Could not find your restaurant.
        </p>
      </div>
    );
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, total, status, created_at")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h1 className="text-xl font-bold">Analytics Error</h1>
        <p className="mt-2">{error.message}</p>
      </div>
    );
  }

  const typedOrders = (orders || []) as Order[];

  const totalOrders = typedOrders.length;

  const completedOrders = typedOrders.filter(
    (order) => order.status === "completed"
  );

  const activeOrders = typedOrders.filter((order) =>
    ["new", "preparing", "ready"].includes(order.status)
  );

  // Revenue is calculated from completed orders only.
  const totalSales = completedOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const averageOrderValue =
    completedOrders.length > 0
      ? totalSales / completedOrders.length
      : 0;

  const completionRate =
    totalOrders > 0
      ? (completedOrders.length / totalOrders) * 100
      : 0;

  // Today's completed revenue.
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const todaySales = completedOrders
    .filter((order) => {
      const date = new Date(order.created_at);
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
      return key === todayKey;
    })
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  // Current calendar month's completed revenue.
  const currentMonthSales = completedOrders
    .filter((order) => {
      const date = new Date(order.created_at);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth()
      );
    })
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  // Last seven calendar days.
  const salesByDay: Record<string, number> = {};

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    salesByDay[key] = 0;
  }

  completedOrders.forEach((order) => {
    const date = new Date(order.created_at);
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    if (key in salesByDay) {
      salesByDay[key] += Number(order.total || 0);
    }
  });

  const salesChartData = Object.entries(salesByDay).map(
    ([date, sales]) => ({
      date: new Date(`${date}T12:00:00`).toLocaleDateString(
        "en-US",
        { weekday: "short" }
      ),
      sales,
    })
  );

  const statCards = [
    {
      title: "Total Revenue",
      value: currency(totalSales),
      description: "Revenue from completed orders",
      icon: "💰",
      color: "bg-green-50",
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      description: "All received orders",
      icon: "🧾",
      color: "bg-orange-50",
    },
    {
      title: "Completed Orders",
      value: completedOrders.length.toLocaleString(),
      description: `${completionRate.toFixed(1)}% completion rate`,
      icon: "✅",
      color: "bg-blue-50",
    },
    {
      title: "Active Orders",
      value: activeOrders.length.toLocaleString(),
      description: "New, preparing and ready",
      icon: "🍳",
      color: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">

      {/* Page heading */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#FF7A00]">
            Performance Report
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#0F5132]">
            Analytics
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Track the performance of {restaurant.name}.
          </p>
        </div>

        <div className="rounded-xl border border-[#EAE3D9] bg-white px-4 py-3 text-sm text-gray-500">
          <span className="font-semibold text-[#0F5132]">
            Reporting period
          </span>
          <p className="mt-1">
            All-time and current month
          </p>
        </div>
      </section>

      {/* Statistics */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color} text-2xl`}>
                  {card.icon}
                </div>
              </div>

              <p className="mt-5 text-sm font-medium text-gray-500">
                {card.title}
              </p>

              <p className="mt-2 break-words text-2xl font-extrabold text-[#0F5132]">
                {card.value}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue summaries */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-[#0F5132] p-6 text-white shadow-sm">
          <p className="text-sm font-medium text-white/70">
            Today's Completed Sales
          </p>
          <p className="mt-3 text-3xl font-extrabold">
            {currency(todaySales)}
          </p>
          <p className="mt-2 text-sm text-white/60">
            Based on completed orders today.
          </p>
        </div>

        <div className="rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            This Month's Completed Sales
          </p>
          <p className="mt-3 text-3xl font-extrabold text-[#0F5132]">
            {currency(currentMonthSales)}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Average completed order: {currency(averageOrderValue)}
          </p>
        </div>
      </section>

      {/* Sales chart */}
      <section className="rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0F5132]">
              Sales Performance
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Completed sales over the last seven days.
            </p>
          </div>

          <span className="rounded-full bg-[#FFF1E3] px-4 py-2 text-xs font-bold text-[#FF7A00]">
            LAST 7 DAYS
          </span>
        </div>

        <div className="mt-8">
          <SalesChart data={salesChartData} />
        </div>
      </section>

      {/* Recent orders */}
      <section className="rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0F5132]">
              Recent Orders
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Your latest customer orders.
            </p>
          </div>

          <a
            href="/admin/orders"
            className="text-sm font-bold text-[#FF7A00] hover:underline"
          >
            View all orders →
          </a>
        </div>

        {typedOrders.length === 0 ? (
          <div className="mt-6 rounded-xl bg-[#FFF8EF] p-8 text-center">
            <p className="text-3xl">🧾</p>
            <p className="mt-3 font-semibold text-[#0F5132]">
              No orders yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Customer orders will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#EAE3D9] text-xs uppercase tracking-wider text-gray-400">
                    <th className="pb-4 font-semibold">Order</th>
                    <th className="pb-4 font-semibold">Date</th>
                    <th className="pb-4 font-semibold">Amount</th>
                    <th className="pb-4 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {typedOrders.slice(0, 10).map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[#F3EEE7] last:border-0"
                    >
                      <td className="py-4 font-semibold text-[#1F1F1F]">
                        #{order.id.slice(0, 8)}
                      </td>

                      <td className="py-4 text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </td>

                      <td className="py-4 font-semibold text-[#0F5132]">
                        {currency(Number(order.total || 0))}
                      </td>

                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mt-6 space-y-3 md:hidden">
              {typedOrders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-[#EAE3D9] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-[#1F1F1F]">
                      #{order.id.slice(0, 8)}
                    </p>

                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>

                    <p className="font-bold text-[#0F5132]">
                      {currency(Number(order.total || 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
