"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderStatus =
  | "new"
  | "preparing"
  | "ready"
  | "completed";

type Props = {
  orderId: string;
  currentStatus: string;
};

const statuses: OrderStatus[] = [
  "new",
  "preparing",
  "ready",
  "completed",
];

const statusLabels: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
};

const nextActionLabels: Record<OrderStatus, string> = {
  new: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Complete Order",
  completed: "Order Completed",
};

export default function OrderStatusButton({
  orderId,
  currentStatus,
}: Props) {
  const [status, setStatus] = useState<OrderStatus>(
    statuses.includes(currentStatus as OrderStatus)
      ? (currentStatus as OrderStatus)
      : "new"
  );

  const [loading, setLoading] = useState(false);

  const currentIndex = statuses.indexOf(status);
  const nextStatus = statuses[currentIndex + 1];

  async function advanceStatus() {
    if (!nextStatus || loading) {
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("orders")
      .update({
        status: nextStatus,
      })
      .eq("id", orderId);

    if (error) {
      alert(`Could not update order status: ${error.message}`);
      setLoading(false);
      return;
    }

    setStatus(nextStatus);
    setLoading(false);
  }

  return (
    <div className="mt-5 border-t pt-5">
      <p className="mb-3 text-sm font-semibold text-gray-700">
        Order Progress
      </p>

      <div className="flex items-center gap-2">
        {statuses.map((item, index) => {
          const isCurrent = item === status;
          const isCompleted = index < currentIndex;

          return (
            <div
              key={item}
              className="flex flex-1 items-center gap-2"
            >
              <div
                className={`flex h-9 flex-1 items-center justify-center rounded-lg text-xs font-semibold ${
                  isCurrent
                    ? "bg-black text-white"
                    : isCompleted
                      ? "bg-gray-200 text-gray-700"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {isCompleted ? "✓ " : ""}
                {statusLabels[item]}
              </div>

              {index < statuses.length - 1 && (
                <div className="text-gray-300">
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            Current status
          </p>

          <p className="font-bold">
            {statusLabels[status]}
          </p>
        </div>

        {nextStatus ? (
          <button
            type="button"
            onClick={advanceStatus}
            disabled={loading}
            className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Updating..."
              : nextActionLabels[status]}
          </button>
        ) : (
          <div className="rounded-lg bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-600">
            ✓ Order Completed
          </div>
        )}
      </div>
    </div>
  );
}