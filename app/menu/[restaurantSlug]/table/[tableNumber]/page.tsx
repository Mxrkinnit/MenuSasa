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
};

export default async function TableMenuPage({
  params,
}: PageProps) {
  const { restaurantSlug, tableNumber } = await params;

  const tableNumberInt = Number(tableNumber);

  if (Number.isNaN(tableNumberInt)) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Invalid table number
        </h1>
      </main>
    );
  }

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

  const { data: table, error: tableError } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .eq("table_number", tableNumberInt)
    .single();

  if (tableError || !table) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Table not found
        </h1>
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
        <RestaurantMenu categories={typedCategories} />
      </div>
    </main>
  );
}