import QRCode from "../../../../components/QRCode";

type PageProps = {
  params: Promise<{
    restaurantSlug: string;
    tableNumber: string;
  }>;
};

export default async function TableQRPage({
  params,
}: PageProps) {
  const { restaurantSlug, tableNumber } = await params;

  const menuUrl =
    `http://localhost:3000/menu/${restaurantSlug}/table/${tableNumber}`;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold">
          Restaurant QR Code
        </h1>

        <p className="mt-2 text-gray-500">
          Table {tableNumber}
        </p>

        <div className="mt-8 flex justify-center">
          <QRCode value={menuUrl} />
        </div>

        <p className="mt-6 text-sm text-gray-400">
          Scan this QR code to view the menu and place
          an order for Table {tableNumber}.
        </p>

        <p className="mt-4 break-all text-xs text-gray-400">
          {menuUrl}
        </p>
      </div>
    </main>
  );
}