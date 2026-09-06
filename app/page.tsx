import { supabase } from "@/lib/supabase";

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

export default async function Home() {
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", "marks-restaurant")
    .single();

  if (restaurantError) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2">{restaurantError.message}</p>
      </main>
    );
  }

  const { data: categories, error: categoriesError } = await supabase
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
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2">{categoriesError.message}</p>
      </main>
    );
  }

  const typedCategories = categories as Category[];

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white px-6 py-8 shadow-sm">
        <h1 className="text-3xl font-bold">{restaurant.name}</h1>

        <p className="mt-2 text-gray-500">
          Browse our menu and place your order.
        </p>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {typedCategories.map((category) => (
          <section key={category.id} className="mb-10">
            <h2 className="mb-4 text-2xl font-bold">
              {category.name}
            </h2>

            <div className="space-y-4">
              {category.menu_items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {item.name}
                      </h3>

                      {item.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <p className="whitespace-nowrap font-semibold">
                      KSh {item.price}
                    </p>
                  </div>

                  <button className="mt-4 w-full rounded-lg bg-black px-4 py-3 font-medium text-white">
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}