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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, ArrowDown, Info, Moon, AlertTriangle } from "lucide-react";

const textDecoder = new TextDecoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

type LogEntry = {
  id: number;
  timestamp: Date;
  type: "RX" | "INFO";
  data: Uint8Array | string;
};

export default function ReceiveModeTab() {
  const { port } = useSerial();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [viewAsHex, setViewAsHex] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextLogId = useRef(0);

  const addLog = (type: "RX" | "INFO", data: Uint8Array | string) => {
    setLogs((prev) => [
      ...prev,
      { id: nextLogId.current++, timestamp: new Date(), type, data },
    ]);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
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
        addLog("INFO", "WOR受信待機を開始しました...");
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

  const formatData = (data: Uint8Array | string) => {
    if (typeof data === "string") return data;
    if (viewAsHex) {
      return bytesToHex(data);
    } else {
      return textDecoder.decode(data).replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ".");
    }
  };

  return (
    <div className="mt-4 space-y-4 text-left">
      {/* Warning Banner for WOR Receive Mode */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-md p-4 flex items-start gap-3">
        <Moon className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-indigo-600 dark:text-indigo-400">
          <p className="font-semibold mb-1">WOR (Wake On Radio) 受信モード</p>
          <p>
            このモードを使用するには、E220モジュールの{" "}
            <strong className="bg-indigo-500/20 px-1 rounded">
              M0ピンを HIGH(1)
            </strong>
            、{" "}
            <strong className="bg-indigo-500/20 px-1 rounded">
              M1ピンを LOW(0)
            </strong>{" "}
            に設定してください。
            <br />
            モジュールは省電力状態で待機し、WOR送信モードの端末からの信号を検知した時のみ起動してデータを受信します。
          </p>
        </div>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">受信データログ (WOR)</CardTitle>
            <CardDescription>
              省電力待機状態で受信したデータを監視します。
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold">通信ログ</span>
              <div className="flex items-center gap-2">
                <Switch
                  id="view-hex-rx"
                  checked={viewAsHex}
                  onCheckedChange={setViewAsHex}
                />
                <Label htmlFor="view-hex-rx" className="text-xs cursor-pointer">
                  Hex(16進数)で表示
                </Label>
              </div>
            </div>

            <ScrollArea
              ref={scrollRef}
              className="h-[400px] w-full rounded-md border bg-muted/50 p-4"
            >
              <div className="space-y-2 font-mono text-sm">
                {!port && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    シリアルポートに接続していません。「Connect」ボタンを押してください。
                  </div>
                )}
                {logs.length === 0 && port && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    スリープ待機中...
                    相手からのウェイクアップ信号とデータを待ちます。
                  </div>
                )}
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 border-b border-border/50 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0 ${
                      log.type === "INFO"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-foreground"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground mt-0.5 shrink-0">
                      [{log.timestamp.toLocaleTimeString()}]
                    </span>
                    <span className="shrink-0 mt-0.5">
                      {log.type === "RX" && (
                        <ArrowDown className="h-4 w-4 text-green-500" />
                      )}
                      {log.type === "INFO" && <Info className="h-4 w-4" />}
                    </span>
                    <span className="break-all whitespace-pre-wrap">
                      {formatData(log.data)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
