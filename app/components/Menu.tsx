"use client";

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
  menu_items: MenuItem[];
};

type MenuProps = {
  categories: Category[];
  onAddToCart: (item: MenuItem) => void;
};

export default function Menu({
  categories,
  onAddToCart,
}: MenuProps) {
  return (
    <div>
      {categories.map((category) => (
        <section key={category.id} className="mb-10">
          <h2 className="mb-4 text-2xl font-bold">
            {category.name}
          </h2>

          <div className="space-y-4">
            {category.menu_items
              .filter((item) => item.available)
              .map((item) => (
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

                  <button
  onClick={() => onAddToCart(item)}
                    className="mt-4 w-full rounded-lg bg-black px-4 py-3 font-medium text-white"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}