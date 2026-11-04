"use client";

import { useCallback, useEffect, useState } from "react";
import { createClientBrowser } from "@/lib/supabase-browser";

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
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#EAE3D9] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/10";

const labelClass = "block text-sm font-semibold text-[#1F1F1F]";

const primaryButton =
  "rounded-xl bg-[#FF7A00] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E66D00] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "rounded-xl border border-[#EAE3D9] px-4 py-2 text-sm font-semibold text-[#0F5132] transition hover:bg-[#FFF8EF] disabled:opacity-50";

export default function RestaurantPage() {
  const supabase = createClientBrowser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantName, setRestaurantName] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);

  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemAvailable, setItemAvailable] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const loadRestaurantData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setRestaurant(null);
        setMessage("Please log in to manage your restaurant.");
        return;
      }

      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id, name, slug, created_at")
        .eq("owner_id", user.id)
        .single();

      if (restaurantError) {
        console.error("Restaurant lookup error:", restaurantError);
        setRestaurant(null);
        setMessage(
          restaurantError.code === "PGRST116"
            ? "No restaurant is linked to this account yet."
            : restaurantError.message
        );
        return;
      }

      setRestaurant(restaurantData);
      setRestaurantName(restaurantData.name);

      const [
        { data: categoryData, error: categoryError },
        { data: itemData, error: itemError },
      ] = await Promise.all([
        supabase
          .from("menu_categories")
          .select("*")
          .eq("restaurant_id", restaurantData.id)
          .order("display_order", { ascending: true }),
        supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restaurantData.id)
          .order("created_at", { ascending: false }),
      ]);

      if (categoryError) throw categoryError;
      if (itemError) throw itemError;

      setCategories((categoryData ?? []) as Category[]);
      setItems((itemData ?? []) as MenuItem[]);
    } catch (error) {
      console.error("Error loading restaurant data:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading your restaurant."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadRestaurantData();
  }, [loadRestaurantData]);

  async function saveRestaurantName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!restaurant || !restaurantName.trim()) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("restaurants")
      .update({ name: restaurantName.trim() })
      .eq("id", restaurant.id);

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setRestaurant({ ...restaurant, name: restaurantName.trim() });
    setMessage("Restaurant name updated successfully.");
  }

  async function saveCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!restaurant || !categoryName.trim()) return;

    setSaving(true);
    setMessage("");

    if (editingCategoryId) {
      const { error } = await supabase
        .from("menu_categories")
        .update({ name: categoryName.trim() })
        .eq("id", editingCategoryId)
        .eq("restaurant_id", restaurant.id);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setCategories((current) =>
        current.map((category) =>
          category.id === editingCategoryId
            ? { ...category, name: categoryName.trim() }
            : category
        )
      );
    } else {
      const { data, error } = await supabase
        .from("menu_categories")
        .insert({
          restaurant_id: restaurant.id,
          name: categoryName.trim(),
          display_order: categories.length,
        })
        .select()
        .single();

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setCategories((current) => [...current, data as Category]);
    }

    setCategoryName("");
    setEditingCategoryId(null);
    setSaving(false);
    setMessage("Category saved successfully.");
  }

  function startEditingCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
  }

  function cancelCategoryEdit() {
    setEditingCategoryId(null);
    setCategoryName("");
  }

  async function deleteCategory(categoryId: string) {
    if (!restaurant) return;

    const confirmed = window.confirm(
      "Delete this category? Make sure no menu items are assigned to it."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", categoryId)
      .eq("restaurant_id", restaurant.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setCategories((current) =>
      current.filter((category) => category.id !== categoryId)
    );
    setMessage("Category deleted.");
  }

  function resetItemForm() {
    setEditingItemId(null);
    setItemName("");
    setItemDescription("");
    setItemPrice("");
    setItemCategory("");
    setItemImageUrl("");
    setItemAvailable(true);
  }

  function startEditingItem(item: MenuItem) {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemDescription(item.description ?? "");
    setItemPrice(String(item.price));
    setItemCategory(item.category_id ?? "");
    setItemImageUrl(item.image_url ?? "");
    setItemAvailable(item.available);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveMenuItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!restaurant || !itemName.trim() || itemPrice.trim() === "") {
      setMessage("Please enter an item name and price.");
      return;
    }

    const price = Number(itemPrice);

    if (!Number.isFinite(price) || price < 0) {
      setMessage("Please enter a valid, non-negative price.");
      return;
    }

    setSaving(true);
    setMessage("");

    const itemData = {
      restaurant_id: restaurant.id,
      category_id: itemCategory || null,
      name: itemName.trim(),
      description: itemDescription.trim() || null,
      price,
      image_url: itemImageUrl.trim() || null,
      available: itemAvailable,
    };

    if (editingItemId) {
      const { data, error } = await supabase
        .from("menu_items")
        .update(itemData)
        .eq("id", editingItemId)
        .eq("restaurant_id", restaurant.id)
        .select()
        .single();

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === editingItemId ? (data as MenuItem) : item
        )
      );
    } else {
      const { data, error } = await supabase
        .from("menu_items")
        .insert(itemData)
        .select()
        .single();

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setItems((current) => [data as MenuItem, ...current]);
    }

    resetItemForm();
    setSaving(false);
    setMessage("Menu item saved successfully.");
  }

  async function deleteMenuItem(itemId: string) {
    if (!restaurant) return;

    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .eq("restaurant_id", restaurant.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== itemId));
    setMessage("Menu item deleted.");
  }

  async function toggleAvailability(item: MenuItem) {
    if (!restaurant) return;

    const nextAvailable = !item.available;

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, available: nextAvailable }
          : currentItem
      )
    );

    const { error } = await supabase
      .from("menu_items")
      .update({ available: nextAvailable })
      .eq("id", item.id)
      .eq("restaurant_id", restaurant.id);

    if (error) {
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, available: item.available }
            : currentItem
        )
      );
      setMessage(error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm font-medium text-[#777777]">
          Loading your restaurant...
        </p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#EAE3D9] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0F5132]">
          Restaurant unavailable
        </h1>
        <p className="mt-3 text-sm text-[#777777]">{message}</p>
        <button onClick={loadRestaurantData} className={`${primaryButton} mt-6`}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#FF7A00]">
          Restaurant management
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#0F5132]">
          Manage your menu
        </h1>
        <p className="mt-2 text-sm text-[#777777]">
          Update your restaurant details, categories and menu items.
        </p>
      </div>

      {message && (
        <div
          className="rounded-xl border border-[#EAE3D9] bg-white px-4 py-3 text-sm text-[#1F1F1F]"
          role="status"
        >
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#0F5132]">
          Restaurant details
        </h2>

        <form
          onSubmit={saveRestaurantName}
          className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className={labelClass}>Restaurant name</label>
            <input
              className={inputClass}
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
            />
          </div>

          <button className={primaryButton} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        <p className="mt-3 text-xs text-[#777777]">
          Restaurant URL slug: {restaurant.slug}
        </p>
      </section>

      <section className="rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#0F5132]">
          Menu categories
        </h2>

        <form
          onSubmit={saveCategory}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <input
            className="w-full flex-1 rounded-xl border border-[#EAE3D9] px-4 py-3 text-sm outline-none focus:border-[#0F5132]"
            placeholder="e.g. Main dishes, Drinks, Desserts"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
          />

          <button className={primaryButton} disabled={saving}>
            {saving
              ? "Saving..."
              : editingCategoryId
                ? "Update category"
                : "Add category"}
          </button>

          {editingCategoryId && (
            <button
              type="button"
              onClick={cancelCategoryEdit}
              className={secondaryButton}
            >
              Cancel
            </button>
          )}
        </form>

        <div className="mt-5 flex flex-wrap gap-3">
          {categories.length === 0 ? (
            <p className="text-sm text-[#777777]">
              No categories yet. Add your first category above.
            </p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-xl border border-[#EAE3D9] bg-[#FFF8EF] px-4 py-3"
              >
                <span className="text-sm font-semibold text-[#1F1F1F]">
                  {category.name}
                </span>
                <button
                  type="button"
                  onClick={() => startEditingCategory(category)}
                  className="text-xs font-semibold text-[#0F5132] hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteCategory(category.id)}
                  className="text-xs font-semibold text-[#DC2626] hover:underline"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-[#0F5132]">
          {editingItemId ? "Edit menu item" : "Add a menu item"}
        </h2>

        <form onSubmit={saveMenuItem} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Item name</label>
              <input
                className={inputClass}
                placeholder="e.g. Chicken biryani"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Price</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 15.00"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <select
                className={inputClass}
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Image URL</label>
              <input
                className={inputClass}
                type="url"
                placeholder="https://example.com/image.jpg"
                value={itemImageUrl}
                onChange={(e) => setItemImageUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="Describe the dish..."
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-[#1F1F1F]">
            <input
              type="checkbox"
              checked={itemAvailable}
              onChange={(e) => setItemAvailable(e.target.checked)}
              className="h-4 w-4 accent-[#0F5132]"
            />
            Available for customers to order
          </label>

          <div className="flex flex-wrap gap-3">
            <button className={primaryButton} disabled={saving}>
              {saving
                ? "Saving..."
                : editingItemId
                  ? "Update menu item"
                  : "Add menu item"}
            </button>

            {editingItemId && (
              <button
                type="button"
                onClick={resetItemForm}
                className={secondaryButton}
              >
                Cancel editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0F5132]">
              Your menu items
            </h2>
            <p className="mt-1 text-sm text-[#777777]">
              {items.length} {items.length === 1 ? "item" : "items"} in your menu
            </p>
          </div>

          <button
            type="button"
            onClick={loadRestaurantData}
            className={secondaryButton}
          >
            Refresh menu
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8CFC2] bg-white p-10 text-center">
            <h3 className="font-semibold text-[#0F5132]">
              Your menu is empty
            </h3>
            <p className="mt-2 text-sm text-[#777777]">
              Add your first menu item using the form above.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const category = categories.find(
                (current) => current.id === item.category_id
              );

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[#EAE3D9] bg-white shadow-sm"
                >
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-[#FFF8EF] text-4xl">
                      🍽️
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#1F1F1F]">
                          {item.name}
                        </h3>
                        {category && (
                          <p className="mt-1 text-xs font-medium text-[#0F5132]">
                            {category.name}
                          </p>
                        )}
                      </div>

                      <span className="whitespace-nowrap font-bold text-[#FF7A00]">
                        {Number(item.price).toFixed(2)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="mt-3 text-sm text-[#777777]">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleAvailability(item)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          item.available
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.available ? "Available" : "Unavailable"}
                      </button>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEditingItem(item)}
                          className="text-sm font-semibold text-[#0F5132] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMenuItem(item.id)}
                          className="text-sm font-semibold text-[#DC2626] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}