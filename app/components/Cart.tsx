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

  if (cart.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Your Cart</h2>
        <p className="mt-2 text-gray-500">
          Your cart is empty.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">Your Cart</h2>

      <div className="space-y-5">
        {cart.map((item) => (
          <div
            key={item.id}
            className="border-b pb-5 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{item.name}</h3>

                <p className="text-sm text-gray-500">
                  KSh {item.price} each
                </p>
              </div>

              <p className="font-semibold">
                KSh {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => onDecrease(item.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200"
              >
                −
              </button>

              <span className="w-6 text-center font-semibold">
                {item.quantity}
              </span>

              <button
                onClick={() => onIncrease(item.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200"
              >
                +
              </button>

              <button
                onClick={() => onRemove(item.id)}
                className="ml-auto text-sm text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-5">
        <span className="text-lg font-bold">Total</span>

        <span className="text-xl font-bold">
          KSh {total.toFixed(2)}
        </span>
      </div>

      <button className="mt-5 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white">
        Checkout
      </button>
    </div>
  );
}