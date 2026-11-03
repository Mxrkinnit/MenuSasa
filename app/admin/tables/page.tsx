
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
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
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTables = useCallback(async (restaurantId: string) => {
    const { data, error: tablesError } = await supabase
      .from("tables")
      .select("id, table_number, qr_token")
      .eq("restaurant_id", restaurantId)
      .order("table_number", { ascending: true });

    if (tablesError) {
      setError(tablesError.message);
      return;
    }

    setTables(data || []);
  }, []);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("Please log in to manage your tables.");
          return;
        }

        const { data, error: restaurantError } = await supabase
          .from("restaurants")
          .select("id, name, slug")
          .eq("owner_id", user.id)
          .single();

        if (restaurantError || !data) {
          setError("Could not find your restaurant.");
          return;
        }

        setRestaurant(data);
        await loadTables(data.id);
      } catch {
        setError("Something went wrong while loading your restaurant.");
      } finally {
        setLoading(false);
      }
    }

    loadRestaurant();
  }, [loadTables]);

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

  async function deleteTable(table: RestaurantTable) {
    if (!restaurant) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete Table ${table.table_number}?`
    );

    if (!confirmed) return;

    setDeletingTableId(table.id);
    setError("");
    setSuccess("");

    // Check whether this table has existing orders.
    const { count, error: ordersError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("table_id", table.id);

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

  function getTableUrl(table: RestaurantTable) {
  if (typeof window === "undefined" || !restaurant) return "";

  return `${window.location.origin}/menu/${restaurant.slug}/table/${table.table_number}?token=${encodeURIComponent(table.qr_token)}`;
}

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-5xl">
          Loading your tables...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to Admin
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          Table Management
        </h1>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-6 rounded-lg bg-green-50 p-4 text-green-700">
            {success}
          </p>
        )}

        {restaurant && (
          <>
            <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                {restaurant.name}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Add tables and generate QR codes for your customers.
              </p>

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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                />

                <button
                  type="submit"
                  disabled={adding}
                  className="rounded-lg bg-black px-6 py-3 font-medium text-white disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add Table"}
                </button>
              </form>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold">
                Your Tables ({tables.length})
              </h2>

              {tables.length === 0 ? (
                <div className="mt-4 rounded-xl bg-white p-6 text-gray-500 shadow-sm">
                  No tables yet. Add your first table above.
                </div>
              ) : (
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm"
                    >
                      <h3 className="mb-4 text-lg font-bold">
                        Table {table.table_number}
                      </h3>

                      <QRCode
                        value={getTableUrl(table)}
                        fileName={`${restaurant.slug}-table-${table.table_number}`}
                      />

                      <p className="mt-4 break-all text-center text-xs text-gray-500">
                        {getTableUrl(table)}
                      </p>

                      <a
                        href={getTableUrl(table)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 text-sm font-medium text-blue-600 hover:underline"
                      >
                        Open customer menu
                      </a>

                      <button
                        type="button"
                        onClick={() => deleteTable(table)}
                        disabled={deletingTableId !== null}
                        className="mt-5 w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingTableId === table.id
                          ? "Deleting..."
                          : "Delete Table"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
