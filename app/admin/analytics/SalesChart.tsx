"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SalesData = {
  date: string;
  sales: number;
};

type SalesChartProps = {
  data: SalesData[];
};

export default function SalesChart({
  data,
}: SalesChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip
            formatter={(value) =>
              `KSh ${Number(value).toFixed(2)}`
            }
          />

          <Line
            type="monotone"
            dataKey="sales"
            stroke="currentColor"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}