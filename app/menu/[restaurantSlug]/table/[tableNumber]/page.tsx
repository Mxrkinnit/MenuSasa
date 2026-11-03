import { supabase } from "@/lib/supabase";
import RestaurantMenu from "../../../../components/RestaurantMenu";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
};

type Category = {
  id: string;
  name: string;
  display_order: number;
  menu_items: MenuItem[];
};

type PageProps = {
  params: Promise<{
    restaurantSlug: string;
    tableNumber: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function TableMenuPage({
  params,
  searchParams,
}: PageProps) {
  const { restaurantSlug, tableNumber } = await params;
  const { token } = await searchParams;

  const tableNumberInt = Number(tableNumber);

  if (
    !Number.isInteger(tableNumberInt) ||
    tableNumberInt < 1
  ) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Invalid table number
        </h1>
      </main>
    );
  }

  if (!token || token.length > 100) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Invalid QR code
        </h1>

        <p className="mt-2 text-gray-500">
          Please scan the QR code on your table.
        </p>
      </main>
    );
  }

  const { data: restaurant, error: restaurantError } =
    await supabase
      .from("restaurants")
      .select("id, name")
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

  const { data: tables, error: tableError } =
    await supabase.rpc("get_public_table", {
      p_restaurant_id: restaurant.id,
      p_table_number: tableNumberInt,
      p_qr_token: token,
    });

  const table = tables?.[0];

  if (tableError || !table) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Invalid table QR code
        </h1>

        <p className="mt-2 text-gray-500">
          Please scan the correct QR code for your table.
        </p>
      </main>
    );
  }

  const { data: categories, error: categoriesError } =
    await supabase
      .from("menu_categories")
      .select(`
        *,
        menu_items (*)
      `)
      .eq("restaurant_id", restaurant.id)
      .order("display_order");

  if (categoriesError) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Could not load menu
        </h1>

        <p className="mt-2">
          {categoriesError.message}
        </p>
      </main>
    );
  }

  const typedCategories = categories as Category[];

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white px-6 py-8 shadow-sm">
        <h1 className="text-3xl font-bold">
          {restaurant.name}
        </h1>

        <p className="mt-2 text-gray-500">
          Table {table.table_number}
        </p>

        <p className="mt-1 text-sm text-gray-400">
          Browse our menu and place your order.
        </p>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <RestaurantMenu
  categories={typedCategories}
  restaurantId={restaurant.id}
  restaurantSlug={restaurantSlug}
  tableId={table.id}
  tableNumber={tableNumber}
  qrToken={token}
/>
      </div>
    </main>
  );
}