import SerialConnectButton from "@/components/SerialConnectButton";
import Tabs from "@/components/Tabs";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center pt-24 pb-12 px-4 md:px-8 bg-background text-foreground">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggleButton />
      </div>

      <div className="w-full max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
          E220 Web Controller
        </h1>

        <Card className="text-left shadow-md">
          <CardContent className="flex flex-col p-8 md:p-10">
            <SerialConnectButton />
            <Separator className="my-8" />
            <Tabs />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
