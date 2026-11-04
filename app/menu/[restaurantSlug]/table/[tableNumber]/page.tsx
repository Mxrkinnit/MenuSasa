
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
      <main className="flex min-h-screen items-center justify-center bg-menusasa-cream px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-menusasa-charcoal">
            Invalid table number
          </h1>
        </div>
      </main>
    );
  }

  if (!token || token.length > 100) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-menusasa-cream px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-menusasa-charcoal">
            Invalid QR code
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Please scan the QR code on your table.
          </p>
        </div>
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
      <main className="flex min-h-screen items-center justify-center bg-menusasa-cream px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-menusasa-charcoal">
            Restaurant not found
          </h1>
        </div>
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
      <main className="flex min-h-screen items-center justify-center bg-menusasa-cream px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-menusasa-charcoal">
            Invalid table QR code
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Please scan the correct QR code for your table.
          </p>
        </div>
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
      <main className="flex min-h-screen items-center justify-center bg-menusasa-cream px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-menusasa-charcoal">
            Could not load menu
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-menusasa-red">
            {categoriesError.message}
          </p>
        </div>
      </main>
    );
  }

  const typedCategories = categories as Category[];

  return (
    <main className="min-h-screen bg-menusasa-cream">
      {/* RESTAURANT HEADER */}
      <header className="bg-menusasa-green px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-200">
            Welcome to MenuSasa
          </p>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            {restaurant.name}
          </h1>

          <div className="mt-4 inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
            Table {table.table_number}
          </div>

          <p className="mt-4 text-sm text-green-50">
            Browse our menu and place your order.
          </p>
        </div>
      </header>

      {/* CUSTOMER MENU */}
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
