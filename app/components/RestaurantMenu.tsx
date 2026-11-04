
"use client";

import { useState } from "react";
import Link from "next/link";
import Menu from "./Menu";
import Cart from "./Cart";
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
  menu_items: MenuItem[];
};

type CartItem = MenuItem & {
  quantity: number;
};

type RestaurantMenuProps = {
  categories: Category[];
  restaurantId: string;
  restaurantSlug: string;
  tableId: string;
  tableNumber: string;
  qrToken?: string;
};

export default function RestaurantMenu({
  categories,
  restaurantId,
  restaurantSlug,
  tableId,
  tableNumber,
  qrToken,
}: RestaurantMenuProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");

  // A valid QR session is required to place orders.
  const hasTableSession = Boolean(
    restaurantId &&
    tableId &&
    tableNumber &&
    qrToken
  );

  const ordersUrl =
    `/menu/${restaurantSlug}/orders?table=${tableNumber}` +
    `&token=${encodeURIComponent(qrToken ?? "")}`;

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function addToCart(item: MenuItem) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...currentCart,
        { ...item, quantity: 1 },
      ];
    });
  }

  function increaseQuantity(itemId: string) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  }

  function decreaseQuantity(itemId: string) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(itemId: string) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== itemId)
    );
  }

  async function placeOrder() {
    if (cart.length === 0 || isSubmitting) return;

    // Do not submit an order without QR table details.
    if (
      !restaurantId ||
      !tableId ||
      !tableNumber ||
      !qrToken
    ) {
      setError(
        "Please scan the QR code at your table before placing an order."
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { data: orderId, error: orderError } =
        await supabase.rpc("create_customer_order", {
          p_restaurant_id: restaurantId,
          p_table_id: tableId,
          p_qr_token: qrToken,
          p_items: cart.map((item) => ({
            menu_item_id: item.id,
            quantity: item.quantity,
          })),
        });

      if (orderError) {
        throw new Error(orderError.message);
      }

      if (!orderId) {
        throw new Error(
          "The order could not be created."
        );
      }

      const storageKey =
        `menusasa_orders_${restaurantSlug}`;

      const existingOrders = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      ) as string[];

      if (!existingOrders.includes(orderId)) {
        existingOrders.push(orderId);
      }

      localStorage.setItem(
        storageKey,
        JSON.stringify(existingOrders)
      );

      setCart([]);
      setOrderSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not place order."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ORDER CONFIRMATION
  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-menusasa-cream px-4 py-12">
        <div className="mx-auto max-w-md rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-menusasa-green text-4xl font-bold text-white">
              ✓
            </div>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-menusasa-charcoal">
            Order Placed!
          </h2>

          <p className="mt-3 text-gray-600">
            Your order has been sent to the kitchen.
          </p>

          <div className="mt-6 rounded-2xl bg-menusasa-cream p-5">
            <p className="text-sm text-gray-500">
              Ordering from
            </p>

            <p className="mt-1 text-xl font-bold text-menusasa-green">
              Table {tableNumber}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
              <span className="h-2 w-2 rounded-full bg-menusasa-orange" />
              Order received
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href={ordersUrl}
              className="block w-full rounded-xl bg-menusasa-green px-5 py-4 font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
            >
              View My Orders
            </Link>

            <button
              onClick={() => {
                window.location.href =
                  `/menu/${restaurantSlug}/table/${tableNumber}`;
              }}
              className="w-full rounded-xl border-2 border-menusasa-green px-5 py-4 font-bold text-menusasa-green transition hover:bg-green-50 active:scale-[0.98]"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-menusasa-cream text-menusasa-charcoal">
      {/* CUSTOMER HEADER */}
      <header className="bg-menusasa-green px-5 py-5 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl text-menusasa-orange">
                ♨
              </span>

              <h1 className="text-2xl font-extrabold tracking-tight">
                MenuSasa
              </h1>
            </div>

            <p className="mt-1 text-sm text-green-100">
              Order from your table, Sasa!
            </p>
          </div>

          {hasTableSession ? (
            <Link
              href={ordersUrl}
              className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              My Orders
            </Link>
          ) : (
            <span className="rounded-xl border border-white/30 px-3 py-2 text-xs font-semibold text-green-100">
              Browse Menu
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-7 pb-28 sm:px-6">
        {!isCheckingOut ? (
          <>
            {/* WELCOME SECTION */}
            <section className="mb-7 overflow-hidden rounded-3xl bg-menusasa-green p-6 text-white shadow-sm sm:p-8">
              {hasTableSession ? (
                <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  TABLE {tableNumber}
                </div>
              ) : (
                <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  WELCOME TO MENUSASA
                </div>
              )}

              <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
                Delicious food,
                <br />
                delivered to your table.
              </h2>

              <p className="mt-3 max-w-md text-sm text-green-100 sm:text-base">
                Explore the menu, choose your favorites,
                and place your order in seconds.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-menusasa-orange px-4 py-2 text-sm font-bold text-white">
                Browse • Order • Enjoy
              </div>
            </section>

            {/* QR NOTICE FOR HOMEPAGE */}
            {!hasTableSession && (
              <section className="mb-7 rounded-2xl border border-orange-200 bg-orange-50 p-5">
                <h2 className="text-lg font-extrabold text-menusasa-green">
                  Ordering from a table?
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-gray-700">
                  You can browse the menu here. To place
                  an order, please scan the QR code at
                  your restaurant table.
                </p>
              </section>
            )}

            {/* MENU */}
            <section className="mb-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-menusasa-orange">
                    Explore
                  </p>

                  <h2 className="mt-1 text-2xl font-extrabold">
                    Our Menu
                  </h2>
                </div>

                <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-menusasa-green shadow-sm">
                  Fresh & Delicious
                </span>
              </div>

              <Menu
                categories={categories}
                onAddToCart={addToCart}
              />
            </section>

            {/* CART */}
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-extrabold">
                  Your Cart
                </h2>

                <span className="rounded-full bg-menusasa-cream px-3 py-1 text-sm font-semibold text-menusasa-green">
                  {totalItems} items
                </span>
              </div>

              <Cart
                cart={cart}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeFromCart}
              />

              {cart.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-semibold text-gray-600">
                      Total
                    </span>

                    <span className="text-2xl font-extrabold text-menusasa-green">
                      KSh {totalPrice.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setError("");
                      setIsCheckingOut(true);
                    }}
                    className="w-full rounded-xl bg-menusasa-orange px-5 py-4 text-base font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          /* CHECKOUT SCREEN */
          <section className="mx-auto max-w-2xl">
            <button
              onClick={() => {
                setError("");
                setIsCheckingOut(false);
              }}
              disabled={isSubmitting}
              className="mb-5 text-sm font-semibold text-menusasa-green hover:underline disabled:opacity-50"
            >
              ← Back to Menu
            </button>

            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-menusasa-orange">
                Almost there
              </p>

              <h2 className="mt-2 text-3xl font-extrabold">
                Review Your Order
              </h2>

              <div className="mt-6 rounded-2xl bg-menusasa-cream p-5">
                <p className="text-sm text-gray-500">
                  Ordering for
                </p>

                <p className="mt-1 text-xl font-bold text-menusasa-green">
                  {hasTableSession
                    ? `Table ${tableNumber}`
                    : "QR code required"}
                </p>
              </div>

              <p className="mt-5 text-sm text-gray-600">
                Please check your items before placing
                your order.
              </p>

              <div className="mt-7 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4"
                  >
                    <div>
                      <p className="font-bold">
                        {item.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        KSh {item.price} × {item.quantity}
                      </p>
                    </div>

                    <p className="whitespace-nowrap font-bold text-menusasa-green">
                      KSh{" "}
                      {(
                        item.price * item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                <span className="text-lg font-bold">
                  Total
                </span>

                <span className="text-2xl font-extrabold text-menusasa-green">
                  KSh {totalPrice.toFixed(2)}
                </span>
              </div>

              {!hasTableSession && (
                <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-sm font-semibold text-menusasa-green">
                    Scan your table QR code to order
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Your cart is ready, but a valid table
                    QR code is required before an order
                    can be submitted.
                  </p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <button
                  onClick={placeOrder}
                  disabled={
                    isSubmitting || !hasTableSession
                  }
                  className="w-full rounded-xl bg-menusasa-green px-5 py-4 font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Placing Order..."
                    : hasTableSession
                    ? "Place Order"
                    : "Scan Table QR Code to Order"}
                </button>

                <button
                  onClick={() => {
                    setError("");
                    setIsCheckingOut(false);
                  }}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border-2 border-menusasa-green px-5 py-4 font-bold text-menusasa-green transition hover:bg-green-50 disabled:opacity-50"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-menusasa-red"
          >
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
