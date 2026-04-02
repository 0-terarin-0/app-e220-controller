import SerialConnectButton from "@/components/SerialConnectButton";
import Tabs from "@/components/Tabs";
import ThemeToggleButton from "@/components/ThemeToggleButton";

export default function Home() {
  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Title Bar / Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-muted/30 px-6">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-primary/80 shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
          <h1 className="text-sm font-semibold tracking-wider text-foreground/90 uppercase">
            E220 Workspace
          </h1>
        </div>
        <ThemeToggleButton />
      </header>

      {/* Connection Toolbar */}
      <section className="flex shrink-0 items-center justify-center border-b bg-card px-6 py-4 shadow-sm z-10">
        <div className="w-full">
          <SerialConnectButton />
        </div>
      </section>

      {/* Main Content Area */}
      <section className="flex flex-1 flex-col overflow-hidden bg-muted/10 p-0 sm:p-4">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-md border-0 sm:border bg-card shadow-none sm:shadow-sm">
          <div className="flex flex-col flex-1 overflow-hidden p-4">
            <Tabs />
          </div>
        </div>
      </section>
    </main>
  );
}
