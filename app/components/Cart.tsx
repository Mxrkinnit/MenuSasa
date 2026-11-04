
"use client";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
};

type CartItem = MenuItem & {
  quantity: number;
};

type CartProps = {
  cart: CartItem[];
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

export default function Cart({
  cart,
  onIncrease,
  onDecrease,
  onRemove,
}: CartProps) {
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (cart.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-menusasa-cream p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
          🛒
        </div>

        <h2 className="mt-4 text-lg font-bold text-menusasa-charcoal">
          Your cart is empty
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Explore our menu and add something delicious
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      {/* CART ITEMS */}
      <div className="divide-y divide-gray-100">
        {cart.map((item) => (
          <div
            key={item.id}
            className="p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-menusasa-charcoal">
                  {item.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  KSh {item.price.toFixed(2)} each
                </p>
              </div>

              <p className="shrink-0 text-right font-bold text-menusasa-green">
                KSh{" "}
                {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>

            {/* QUANTITY AND REMOVE CONTROLS */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDecrease(item.id)}
                  aria-label={`Decrease ${item.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-100 bg-menusasa-cream text-xl font-semibold text-menusasa-green transition hover:bg-green-50 active:scale-95"
                >
                  −
                </button>

                <span className="w-8 text-center font-bold text-menusasa-charcoal">
                  {item.quantity}
                </span>

                <button
                  type="button"
                  onClick={() => onIncrease(item.id)}
                  aria-label={`Increase ${item.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-menusasa-orange text-xl font-semibold text-white transition hover:opacity-90 active:scale-95"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="rounded-lg px-2 py-2 text-sm font-semibold text-menusasa-red transition hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CART TOTAL */}
      <div className="border-t border-gray-100 bg-menusasa-cream p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Order Total
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"}
            </p>
          </div>

          <p className="text-xl font-extrabold text-menusasa-green sm:text-2xl">
            KSh {total.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
