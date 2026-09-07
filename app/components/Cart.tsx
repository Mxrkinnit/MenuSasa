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
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Your Cart</h2>

        <p className="mt-2 text-gray-500">
          Your cart is empty.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h2 className="text-xl font-bold">
            Your Cart
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {itemCount}{" "}
            {itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
  {itemCount} {itemCount === 1 ? "item" : "items"}
</div>
      </div>

      <div className="divide-y">
        {cart.map((item) => (
          <div
            key={item.id}
            className="p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold">
                  {item.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  KSh {item.price.toFixed(2)} each
                </p>
              </div>

              <p className="whitespace-nowrap font-semibold">
                KSh{" "}
                {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center rounded-lg border">
                <button
                  onClick={() => onDecrease(item.id)}
                  className="flex h-10 w-10 items-center justify-center text-lg transition-all duration-150 hover:bg-gray-100 active:scale-90"
                  aria-label={`Decrease ${item.name}`}
                >
                  −
                </button>

                <span className="w-10 text-center font-semibold">
                  {item.quantity}
                </span>

                <button
                  onClick={() => onIncrease(item.id)}
                  className="flex h-10 w-10 items-center justify-center text-lg transition-all duration-150 hover:bg-gray-100 active:scale-90"
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </button>
              </div>

              <button
                onClick={() => onRemove(item.id)}
                className="text-sm text-red-600 transition-opacity hover:opacity-70"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t bg-gray-50 p-5">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">
            Total
          </span>

          <span className="text-xl font-bold">
            KSh {total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}