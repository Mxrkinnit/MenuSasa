
import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">
          MenuSasa Admin
        </h1>

        <p className="mt-2 text-gray-500">
          Manage your restaurant from one place.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/restaurant"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-bold">Restaurant</h2>
            <p className="mt-2 text-gray-500">
              Manage your restaurant details and menu.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-bold">Orders</h2>
            <p className="mt-2 text-gray-500">
              View and manage customer orders.
            </p>
          </Link>

          <Link
            href="/admin/analytics"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-bold">Analytics</h2>
            <p className="mt-2 text-gray-500">
              View your restaurant performance.
            </p>
          </Link>

          <Link
            href="/admin/tables"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-bold">Tables & QR Codes</h2>
            <p className="mt-2 text-gray-500">
              Add tables and generate QR codes for customers.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
