"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

type Category = {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  created_at: string;
};

type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  created_at: string;
};

export default function RestaurantAdminPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [name, setName] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );

  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRestaurant() {
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", "marks-restaurant")
        .single();

      if (restaurantError || !restaurantData) {
        setError(
          restaurantError?.message || "Could not load restaurant."
        );
        setLoading(false);
        return;
      }

      setRestaurant(restaurantData);
      setName(restaurantData.name);

      const { data: categoryData, error: categoryError } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .order("display_order", { ascending: true });

      if (categoryError) {
        setError(categoryError.message);
      } else {
        setCategories(categoryData || []);
      }

      const { data: menuItemData, error: menuItemError } =
  await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantData.id)
    .order("created_at", {
      ascending: true,
    });

if (menuItemError) {
  setError(menuItemError.message);
} else {
  setMenuItems(menuItemData || []);
}

      setLoading(false);
    }

    loadRestaurant();
  }, []);

  async function saveRestaurant() {
    if (!restaurant) return;

    if (!name.trim()) {
      setError("Restaurant name cannot be empty.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("restaurants")
      .update({
        name: name.trim(),
      })
      .eq("id", restaurant.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setRestaurant({
      ...restaurant,
      name: name.trim(),
    });

    setMessage("Restaurant name updated successfully.");
    setSaving(false);
  }

  async function addCategory() {
    if (!restaurant) return;

    if (!newCategory.trim()) {
      setError("Category name cannot be empty.");
      return;
    }

    setAddingCategory(true);
    setMessage("");
    setError("");

    const nextDisplayOrder =
      categories.length > 0
        ? Math.max(
            ...categories.map(
              (category) => category.display_order
            )
          ) + 1
        : 1;

    const { data, error } = await supabase
      .from("menu_categories")
      .insert({
        restaurant_id: restaurant.id,
        name: newCategory.trim(),
        display_order: nextDisplayOrder,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setAddingCategory(false);
      return;
    }

    setCategories((current) =>
      [...current, data].sort(
        (a, b) => a.display_order - b.display_order
      )
    );

    setNewCategory("");
    setMessage("Category added successfully.");
    setAddingCategory(false);
  }

  function startEditingCategory(category: Category) {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setMessage("");
    setError("");
  }

  function cancelEditingCategory() {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  }

  async function saveCategory(categoryId: string) {
    if (!editingCategoryName.trim()) {
      setError("Category name cannot be empty.");
      return;
    }

    setMessage("");
    setError("");

    const { error } = await supabase
      .from("menu_categories")
      .update({
        name: editingCategoryName.trim(),
      })
      .eq("id", categoryId);

    if (error) {
      setError(error.message);
      return;
    }

    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              name: editingCategoryName.trim(),
            }
          : category
      )
    );

    setEditingCategoryId(null);
    setEditingCategoryName("");
    setMessage("Category updated successfully.");
  }

  async function deleteCategory(categoryId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      setError(error.message);
      return;
    }

    setCategories((current) =>
      current.filter((category) => category.id !== categoryId)
    );

    setMessage("Category deleted successfully.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-gray-500">
            Loading restaurant...
          </p>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold">
            Restaurant Management
          </h1>

          <p className="mt-4 text-red-600">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">
          Restaurant Management
        </h1>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Restaurant Details
          </h2>

          <label className="mt-5 block text-sm font-medium text-gray-700">
            Restaurant Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
          />

          <button
            onClick={saveRestaurant}
            disabled={saving}
            className="mt-4 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition-all duration-150 hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <div className="mt-5 space-y-3 border-t pt-5">
            <div>
              <p className="text-sm text-gray-500">
                Slug
              </p>

              <p className="mt-1 font-medium">
                {restaurant.slug}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Restaurant ID
              </p>

              <p className="mt-1 break-all font-medium">
                {restaurant.id}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Menu Categories
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage the categories used by your menu.
          </p>

          <div className="mt-5 flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="e.g. Main Courses"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addCategory();
                }
              }}
            />

            <button
              onClick={addCategory}
              disabled={addingCategory}
              className="rounded-lg bg-black px-5 py-3 font-semibold text-white transition-all duration-150 hover:opacity-80 active:scale-95 disabled:opacity-50"
            >
              {addingCategory ? "Adding..." : "Add"}
            </button>
          </div>

          <div className="mt-6 divide-y rounded-xl border">
            {categories.length === 0 ? (
              <p className="p-5 text-sm text-gray-500">
                No categories yet.
              </p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="p-4"
                >
                  {editingCategoryId === category.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(event) =>
                          setEditingCategoryName(event.target.value)
                        }
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                        autoFocus
                      />

                      <button
                        onClick={() => saveCategory(category.id)}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
                      >
                        Save
                      </button>

                      <button
                        onClick={cancelEditingCategory}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {category.name}
                        </p>

                        <p className="text-xs text-gray-400">
                          Display order: {category.display_order}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            startEditingCategory(category)
                          }
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium transition hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteCategory(category.id)
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
  <h2 className="text-xl font-bold">
    Menu Items
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Manage the items that appear on your restaurant menu.
  </p>

  <div className="mt-6 divide-y rounded-xl border">
    {menuItems.length === 0 ? (
      <p className="p-5 text-sm text-gray-500">
        No menu items yet.
      </p>
    ) : (
      menuItems.map((item) => {
        const category = categories.find(
          (category) => category.id === item.category_id
        );

        return (
          <div
            key={item.id}
            className="p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">
                  {item.name}
                </h3>

                {item.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {item.description}
                  </p>
                )}

                <p className="mt-2 text-sm font-medium">
                  KSh {Number(item.price).toFixed(2)}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Category:{" "}
                  {category?.name || "Unknown category"}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  item.available
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {item.available
                  ? "Available"
                  : "Unavailable"}
              </span>
            </div>
          </div>
        );
      })
    )}
  </div>
</div>

        {message && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}