
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClientBrowser } from "@/lib/supabase-browser";
import QRCode from "@/app/components/QRCode";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
};

type RestaurantTable = {
  id: string;
  table_number: number;
  qr_token: string;
};

export default function TablesPage() {
  const [supabase] = useState(() => createClientBrowser());

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tableNumber, setTableNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load tables belonging to the restaurant.
  const loadTables = useCallback(
    async (restaurantId: string) => {
      const { data, error: tablesError } = await supabase
        .from("tables")
        .select("id, table_number, qr_token")
        .eq("restaurant_id", restaurantId)
        .order("table_number", { ascending: true });

      if (tablesError) {
        setError(tablesError.message);
        return;
      }

      setTables((data || []) as RestaurantTable[]);
    },
    [supabase]
  );

  // Load the logged-in owner's restaurant.
  const loadRestaurant = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Please log in to manage your tables.");
        setRestaurant(null);
        return;
      }

      const { data, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id, name, slug")
        .eq("owner_id", user.id)
        .single();

      if (restaurantError || !data) {
        setError(
          restaurantError?.message || "Could not find your restaurant."
        );
        setRestaurant(null);
        return;
      }

      setRestaurant(data as Restaurant);

      await loadTables(data.id);
    } catch (err) {
      console.error("Error loading restaurant:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading your restaurant."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, loadTables]);

  useEffect(() => {
    void loadRestaurant();
  }, [loadRestaurant]);

  // Add a new table.
  async function addTable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!restaurant) return;

    const number = Number(tableNumber);

    if (!Number.isInteger(number) || number < 1) {
      setError("Please enter a valid table number.");
      return;
    }

    setAdding(true);
    setError("");
    setSuccess("");

    const { error: insertError } = await supabase
      .from("tables")
      .insert({
        restaurant_id: restaurant.id,
        table_number: number,
        qr_token: crypto.randomUUID(),
      });

    if (insertError) {
      if (insertError.code === "23505") {
        setError(`Table ${number} already exists.`);
      } else {
        setError(insertError.message);
      }

      setAdding(false);
      return;
    }

    setTableNumber("");
    setSuccess(`Table ${number} added successfully.`);

    await loadTables(restaurant.id);

    setAdding(false);
  }

  // Delete a table only if it has no existing orders.
  async function deleteTable(table: RestaurantTable) {
    if (!restaurant) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete Table ${table.table_number}?`
    );

    if (!confirmed) return;

    setDeletingTableId(table.id);
    setError("");
    setSuccess("");

    const { count, error: ordersError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("table_id", table.id)
      .eq("restaurant_id", restaurant.id);

    if (ordersError) {
      setError(ordersError.message);
      setDeletingTableId(null);
      return;
    }

    if (count !== null && count > 0) {
      setError(
        `Table ${table.table_number} cannot be deleted because it has existing orders.`
      );

      setDeletingTableId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("tables")
      .delete()
      .eq("id", table.id)
      .eq("restaurant_id", restaurant.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingTableId(null);
      return;
    }

    setSuccess(`Table ${table.table_number} deleted successfully.`);

    await loadTables(restaurant.id);

    setDeletingTableId(null);
  }

  // Generate the customer menu URL.
  function getTableUrl(table: RestaurantTable) {
    if (typeof window === "undefined" || !restaurant) return "";

    return `${window.location.origin}/menu/${restaurant.slug}/table/${table.table_number}?token=${encodeURIComponent(table.qr_token)}`;
  }

  // Loading screen.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#EAE3D9] border-t-[#0F5132]" />

          <p className="mt-4 text-sm text-[#777777]">
            Loading your tables...
          </p>
        </div>
      </div>
    );
  }

  // Restaurant unavailable.
  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#EAE3D9] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0F5132]">
          Table Management
        </h1>

        <p className="mt-3 text-sm text-red-600">
          {error || "Could not find your restaurant."}
        </p>

        <button
          onClick={() => void loadRestaurant()}
          className="mt-6 rounded-xl bg-[#FF7A00] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E66D00]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* Page heading */}
      <header>
        <Link
          href="/admin"
          className="text-sm font-semibold text-[#0F5132] transition hover:text-[#FF7A00]"
        >
          ← Back to Admin
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#FF7A00]">
          Restaurant Management
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F5132] sm:text-4xl">
          Table Management
        </h1>

        <p className="mt-2 text-sm text-[#777777]">
          Create tables and generate QR codes for your customers.
        </p>
      </header>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {success}
        </div>
      )}

      {/* Restaurant details and add table */}
      <section className="rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF7A00]">
            Your Restaurant
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#0F5132]">
            {restaurant.name}
          </h2>

          <p className="mt-2 text-sm text-[#777777]">
            Add a table below to generate its unique customer QR code.
          </p>
        </div>

        <form
          onSubmit={addTable}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="number"
            min="1"
            step="1"
            required
            value={tableNumber}
            onChange={(event) => setTableNumber(event.target.value)}
            placeholder="Enter table number"
            className="w-full flex-1 rounded-xl border border-[#EAE3D9] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/10"
          />

          <button
            type="submit"
            disabled={adding}
            className="rounded-xl bg-[#FF7A00] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#E66D00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? "Adding Table..." : "+ Add Table"}
          </button>
        </form>
      </section>

      {/* Tables heading */}
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0F5132]">
              Your Tables
            </h2>

            <p className="mt-1 text-sm text-[#777777]">
              {tables.length} {tables.length === 1 ? "table" : "tables"} created
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTables(restaurant.id)}
            className="rounded-xl border border-[#EAE3D9] bg-white px-4 py-2 text-sm font-semibold text-[#0F5132] transition hover:bg-[#FFF8EF]"
          >
            ↻ Refresh Tables
          </button>
        </div>

        {tables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8CFC2] bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF8EF] text-3xl">
              ▦
            </div>

            <h3 className="mt-5 text-lg font-bold text-[#0F5132]">
              No tables yet
            </h3>

            <p className="mt-2 text-sm text-[#777777]">
              Add your first table above to generate a QR code.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) => {
              const tableUrl = getTableUrl(table);

              return (
                <article
                  key={table.id}
                  className="flex flex-col items-center rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="w-full text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#FF7A00]">
                      Customer QR Code
                    </p>

                    <h3 className="mt-2 text-xl font-extrabold text-[#0F5132]">
                      Table {table.table_number}
                    </h3>
                  </div>

                  <div className="mt-5 rounded-xl border border-[#EAE3D9] bg-white p-3">
                    <QRCode
                      value={tableUrl}
                      fileName={`${restaurant.slug}-table-${table.table_number}`}
                    />
                  </div>

                  <p className="mt-4 break-all text-center text-xs leading-5 text-[#777777]">
                    {tableUrl}
                  </p>

                  <a
                    href={tableUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 w-full rounded-xl bg-[#0F5132] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0B3D26]"
                  >
                    Open Customer Menu
                  </a>

                  <button
                    type="button"
                    onClick={() => void deleteTable(table)}
                    disabled={deletingTableId !== null}
                    className="mt-3 w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingTableId === table.id
                      ? "Deleting..."
                      : "Delete Table"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
