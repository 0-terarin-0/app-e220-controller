import SerialConnectButton from "@/components/SerialConnectButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="z-10 w-full max-w-md items-center justify-between font-mono text-sm">
        <h1 className="text-3xl font-bold text-center mb-8 text-black">
          IoTコントロールダッシュボード
        </h1>

        {/* ここでさっき作ったボタンコンポーネントを呼び出す */}
        <SerialConnectButton />
      </div>
    </main>
  );
}
