"use client";

import { useState } from "react";
import Menu from "./Menu";
import Cart from "./Cart";

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

export default function RestaurantMenu({
  categories,
}: {
  categories: Category[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

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
        {
          ...item,
          quantity: 1,
        },
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
    </div>
  );
}