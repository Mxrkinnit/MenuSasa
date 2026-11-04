
"use client";

import { useState } from "react";

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
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const visibleCategories =
    selectedCategory === "all"
      ? categories
      : categories.filter(
          (category) => category.id === selectedCategory
        );

  const availableCategories = categories.filter(
    (category) =>
      category.menu_items.some((item) => item.available)
  );

  return (
    <div className="space-y-7">
      {/* CATEGORY FILTERS */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition ${
            selectedCategory === "all"
              ? "bg-menusasa-green text-white shadow-sm"
              : "bg-white text-menusasa-green hover:bg-green-50"
          }`}
        >
          All Items
        </button>

        {availableCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() =>
              setSelectedCategory(category.id)
            }
            className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition ${
              selectedCategory === category.id
                ? "bg-menusasa-green text-white shadow-sm"
                : "bg-white text-menusasa-green hover:bg-green-50"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* FOOD CATEGORIES */}
      {visibleCategories.map((category) => {
        const availableItems =
          category.menu_items.filter(
            (item) => item.available
          );

        if (availableItems.length === 0) {
          return null;
        }

        return (
          <section key={category.id} className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-menusasa-charcoal sm:text-2xl">
                {category.name}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Explore our delicious selection
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {availableItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-menusasa-cream text-xl">
                      🍽️
                    </div>

                    <h3 className="text-lg font-bold text-menusasa-charcoal">
                      {item.name}
                    </h3>

                    {item.description && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-500">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <p className="text-lg font-extrabold text-menusasa-green">
                      KSh {Number(item.price).toFixed(2)}
                    </p>

                    <button
                      type="button"
                      onClick={() => onAddToCart(item)}
                      aria-label={`Add ${item.name} to cart`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-menusasa-orange text-2xl font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {availableCategories.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">🍽️</div>

          <h3 className="mt-3 text-lg font-bold text-menusasa-charcoal">
            No menu items available
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Please check back again soon.
          </p>
        </div>
      )}
    </div>
  );
}
