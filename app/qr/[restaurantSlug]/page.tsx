import { supabase } from "@/lib/supabase";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    restaurantSlug: string;
  }>;
};

export default async function QRManagementPage({
  params,
}: PageProps) {
  const { restaurantSlug } = await params;

  const { data: restaurant, error: restaurantError } =
    await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", restaurantSlug)
      .single();

  if (restaurantError || !restaurant) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Restaurant not found
        </h1>
      </main>
    );
  }

  const { data: tables, error: tablesError } =
    await supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("table_number");

  if (tablesError) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Could not load tables
        </h1>

        <p className="mt-2 text-gray-500">
          {tablesError.message}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            {restaurant.name}
          </h1>

          <p className="mt-2 text-gray-500">
            QR Table Management
          </p>
        </header>

        <div className="space-y-4">
          {tables?.map((table) => (
            <div
              key={table.id}
              className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-lg font-bold">
                  Table {table.table_number}
                </p>

                <p className="text-sm text-gray-500">
                  QR code for Table {table.table_number}
                </p>
              </div>

              <Link
                href={`/qr/${restaurantSlug}/table/${table.table_number}`}
                className="rounded-lg bg-black px-4 py-2 font-semibold text-white transition-all hover:opacity-80 active:scale-95"
              >
                View QR
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}