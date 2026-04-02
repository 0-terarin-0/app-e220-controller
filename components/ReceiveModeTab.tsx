"use client";

import { useState, useEffect, useRef } from "react";
import { useSerial } from "@/contexts/SerialContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Info, ArrowDown, AlertCircle } from "lucide-react";

const textDecoder = new TextDecoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

function bytesToText(bytes: Uint8Array): string {
  // Replace unprintable characters with a dot to avoid UI breaks
  return textDecoder.decode(bytes).replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ".");
}

type LogEntry = {
  id: string;
  type: "RX" | "INFO";
  data: Uint8Array | string;
  timestamp: Date;
};

export default function ReceiveModeTab() {
  const { port } = useSerial();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (type: "RX" | "INFO", data: Uint8Array | string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        data,
        timestamp: new Date(),
      },
    ]);
  };

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [logs]);

  // Serial Read Loop
  useEffect(() => {
    if (!port || !port.readable) return;

    let keepReading = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    const readLoop = async () => {
      try {
        reader = port.readable.getReader();
        addLog("INFO", "受信待機を開始しました...");
        while (keepReading) {
          const { value, done } = await reader!.read();
          if (done) break;
          if (value && value.length > 0) {
            addLog("RX", value);
          }
        }
      } catch (error: any) {
        if (keepReading) {
          console.error("Read loop error:", error);
          addLog("INFO", `読み取りエラー: ${error.message}`);
        }
      } finally {
        if (reader) {
          reader.releaseLock();
        }
      }
    };

    readLoop();

    return () => {
      keepReading = false;
      if (reader) {
        reader.cancel().catch(console.error);
      }
    };
  }, [port]);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="flex flex-col h-full text-left overflow-hidden">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 flex items-start gap-3 shrink-0 mb-4">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-600 dark:text-blue-400">
          <p className="font-semibold mb-1">
            WOR (Wake On Radio) 受信モード / スリープ
          </p>
          <p>
            このモードを使用するには、E220モジュールの{" "}
            <strong>M0ピンを HIGH(1)</strong>、<strong>M1ピンを LOW(0)</strong>{" "}
            に設定してください。
            <br />
            通常は低消費電力のスリープ状態にあり、同じチャンネル・アドレスの送信機からプリアンブルを受信した時のみ起動してデータを受け取ります。
          </p>
        </div>
      </div>

      <Card className="flex flex-col flex-1 overflow-hidden shadow-none border-border">
        <CardHeader className="pb-4 shrink-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">WOR受信ログ</CardTitle>
            <CardDescription>
              スリープ中に受信したデータを表示します。
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            ログ消去
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 overflow-hidden space-y-2 pt-0">
          <div className="flex items-center justify-between px-1 shrink-0">
            <span className="text-sm font-semibold">受信データ</span>
          </div>

          <ScrollArea
            ref={scrollRef}
            className="flex-1 w-full rounded-md border bg-muted/30 p-4"
          >
            <div className="flex flex-col">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  受信データはありません。
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="border-b border-border/40 py-3 last:border-0"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      {log.type === "RX" && (
                        <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                          <ArrowDown className="h-4 w-4" /> RX
                        </span>
                      )}
                      {log.type === "INFO" && (
                        <span className="text-amber-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" /> INFO
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-normal">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {log.type === "INFO" ? (
                      <div className="text-base text-muted-foreground ml-6">
                        {log.data as string}
                      </div>
                    ) : (
                      <div className="grid grid-cols-[40px_1fr] gap-x-3 gap-y-1.5 text-base font-mono ml-6">
                        <span className="text-muted-foreground/70 select-none">
                          HEX
                        </span>
                        <span className="break-all text-foreground/90">
                          {bytesToHex(log.data as Uint8Array)}
                        </span>
                        <span className="text-muted-foreground/70 select-none">
                          TXT
                        </span>
                        <span className="break-all text-foreground/90 whitespace-pre-wrap">
                          {bytesToText(log.data as Uint8Array)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
