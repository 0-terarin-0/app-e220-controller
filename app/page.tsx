import SerialConnectButton from "@/components/SerialConnectButton";
import Tabs from "@/components/Tabs";
import ThemeToggleButton from "@/components/ThemeToggleButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-background text-foreground">
      <div className="z-10 w-full max-w-md font-mono text-sm">
        <div className="w-full flex justify-end">
          <ThemeToggleButton />
        </div>
        <h1 className="text-3xl font-bold text-center my-8">
          E220 Control Panel
        </h1>

        {/* ここでさっき作ったボタンコンポーネントを呼び出す */}
        <SerialConnectButton />
        <Tabs />
      </div>
    </main>
  );
}
