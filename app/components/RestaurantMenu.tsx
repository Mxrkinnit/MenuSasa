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
};

export default function RestaurantMenu({
  categories,
  restaurantId,
  tableId,
}: RestaurantMenuProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
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

    const orderId = crypto.randomUUID();

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
          onClick={placeOrder}
          disabled={isSubmitting}
          className="w-full rounded-lg bg-black px-4 py-4 font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </button>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}