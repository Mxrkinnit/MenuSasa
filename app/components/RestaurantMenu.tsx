"use client";

import { useState } from "react";
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
  tableId: string;
  tableNumber: string;
};

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
}

export default function RestaurantMenu({
  categories,
  restaurantId,
  tableId,
  tableNumber,
}: RestaurantMenuProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");

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

      return [...currentCart, { ...item, quantity: 1 }];
    });
  }

  function increaseQuantity(itemId: string) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === itemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decreaseQuantity(itemId: string) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity - 1 }
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
    if (cart.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

  const orderId = generateUUID();

const { error: orderError } = await supabase
  .from("orders")
  .insert({
    id: orderId,
    restaurant_id: restaurantId,
    table_id: tableId,
    status: "new",
    total: total,
  });

    if (orderError) {
      setError(
        orderError?.message || "Could not create order."
      );
      setIsSubmitting(false);
      return;
    }

    const orderItems = cart.map((item) => ({
      order_id: orderId,
      menu_item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      setError(itemsError.message);
      setIsSubmitting(false);
      return;
    }

    setCart([]);
    setOrderSubmitted(true);
    setIsSubmitting(false);
  }

  if (orderSubmitted) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">✓</div>

        <h2 className="mt-4 text-2xl font-bold">
          Order Placed!
        </h2>

        <p className="mt-2 text-gray-500">
          Your order has been sent to the counter.
        </p>

        <p className="mt-4 text-sm text-gray-400">
          Table order successfully submitted.
        </p>
      </div>
    );
  }



  return (
  <div className="space-y-10">
    {!isCheckingOut ? (
      <>
        <Menu
          categories={categories}
          onAddToCart={addToCart}
        />

        <Cart
          cart={cart}
          onIncrease={increaseQuantity}
          onDecrease={decreaseQuantity}
          onRemove={removeFromCart}
        />

        {cart.length > 0 && (
          <button
            onClick={() => setIsCheckingOut(true)}
            className="w-full rounded-lg bg-black px-4 py-4 font-semibold text-white transition-all duration-150 hover:opacity-80 active:scale-[0.98]"
          >
            Checkout
          </button>
        )}
      </>
    ) : (
      <div className="rounded-xl bg-white p-6 shadow-sm">
       <div>
  <h2 className="text-2xl font-bold">
    Review Your Order
  </h2>

  <div className="mt-4 rounded-xl bg-gray-100 p-4">
    <p className="text-sm text-gray-500">
      Ordering for
    </p>

    <p className="mt-1 text-lg font-bold">
  Table {tableNumber}
</p>
  </div>

  <p className="mt-4 text-gray-500">
    Please check your order before placing it.
  </p>
</div>

        <div className="mt-6 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b pb-4"
            >
              <div>
                <p className="font-semibold">
                  {item.name}
                </p>

                <p className="text-sm text-gray-500">
                  KSh {item.price} × {item.quantity}
                </p>
              </div>

              <p className="font-semibold">
                KSh {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t pt-5">
          <span className="text-lg font-bold">
            Total
          </span>

          <span className="text-xl font-bold">
            KSh{" "}
            {cart
              .reduce(
                (sum, item) =>
                  sum + item.price * item.quantity,
                0
              )
              .toFixed(2)}
          </span>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={placeOrder}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-black px-4 py-4 font-semibold text-white transition-all duration-150 hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting
              ? "Placing Order..."
              : "Place Order"}
          </button>

          <button
            onClick={() => setIsCheckingOut(false)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-gray-300 px-4 py-4 font-semibold transition-all duration-150 hover:bg-gray-50 active:scale-[0.98]"
          >
            Back to Menu
          </button>
        </div>
      </div>
    )}

    {error && (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    )}
  </div>
);
}