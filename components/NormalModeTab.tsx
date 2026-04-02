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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, Trash2, ArrowDown, ArrowUp, Info } from "lucide-react";
import { toast } from "sonner";

// Helper functions for data conversion
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

function hexToBytes(hexString: string): Uint8Array {
  // Remove all non-hex characters (spaces, commas, etc.)
  const cleanHex = hexString.replace(/[^0-9A-Fa-f]/g, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("16進数の文字数が偶数ではありません。");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToText(bytes: Uint8Array): string {
  // Replace unprintable characters with a dot to avoid UI breaks
  return textDecoder.decode(bytes).replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ".");
}

type LogEntry = {
  id: string;
  type: "TX" | "RX" | "INFO";
  data: Uint8Array | string;
  timestamp: Date;
};

export default function NormalModeTab() {
  const { port } = useSerial();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendAsHex, setSendAsHex] = useState(false);
  const [appendCrLf, setAppendCrLf] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (type: "TX" | "RX" | "INFO", data: Uint8Array | string) => {
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

  const handleSend = async () => {
    if (!port || !port.writable) {
      toast.error("ポートが接続されていないか、書き込みできません。");
      return;
    }
    if (!inputMessage.trim()) return;

    let payload: Uint8Array;

    try {
      if (sendAsHex) {
        payload = hexToBytes(inputMessage);
        if (appendCrLf) {
          const crlf = new Uint8Array([0x0d, 0x0a]);
          const newPayload = new Uint8Array(payload.length + crlf.length);
          newPayload.set(payload);
          newPayload.set(crlf, payload.length);
          payload = newPayload;
        }
      } else {
        let text = inputMessage;
        if (appendCrLf) text += "\r\n";
        payload = textEncoder.encode(text);
      }
    } catch (err: any) {
      toast.error(`入力データのエラー: ${err.message}`);
      return;
    }

    try {
      const writer = port.writable.getWriter();
      await writer.write(payload);
      writer.releaseLock();

      addLog("TX", payload);
    } catch (err: any) {
      console.error("Write error:", err);
      toast.error(`送信エラー: ${err.message}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="flex flex-col h-full text-left">
      <Card className="flex flex-col flex-1 overflow-hidden shadow-none border-border">
        <CardHeader className="pb-4 shrink-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">通常モード (送受信テスト)</CardTitle>
            <CardDescription>
              E220モジュールを経由してデータを送受信します。
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
        <CardContent className="flex flex-col flex-1 overflow-hidden space-y-4 pt-0">
          {/* Receiver / Log Area */}
          <div className="flex flex-col flex-1 overflow-hidden space-y-2">
            <div className="flex items-center justify-between px-1 shrink-0">
              <span className="text-sm font-semibold">通信ログ</span>
            </div>

            <ScrollArea
              ref={scrollRef}
              className="flex-1 w-full rounded-md border bg-muted/30 p-4"
            >
              <div className="flex flex-col">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    通信ログはありません。
                  </p>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="border-b border-border/40 py-3 last:border-0"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                        {log.type === "TX" && (
                          <span className="text-blue-500 dark:text-blue-400 flex items-center gap-1">
                            <ArrowUp className="h-4 w-4" /> TX
                          </span>
                        )}
                        {log.type === "RX" && (
                          <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                            <ArrowDown className="h-4 w-4" /> RX
                          </span>
                        )}
                        {log.type === "INFO" && (
                          <span className="text-amber-500 flex items-center gap-1">
                            <Info className="h-4 w-4" /> INFO
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
          </div>

          {/* Sender Area */}
          <div className="shrink-0 space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold">データ送信</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="send-hex"
                    checked={sendAsHex}
                    onCheckedChange={setSendAsHex}
                  />
                  <Label htmlFor="send-hex" className="text-xs cursor-pointer">
                    Hex(16進数)として解釈
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="append-crlf"
                    checked={appendCrLf}
                    onCheckedChange={setAppendCrLf}
                  />
                  <Label
                    htmlFor="append-crlf"
                    className="text-xs cursor-pointer"
                  >
                    CRLF(\r\n)を付与
                  </Label>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={
                  sendAsHex
                    ? "送信する16進数を入力 (例: 0A 1B 2C)..."
                    : "送信するテキストを入力 (半角英数字)..."
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 font-mono text-base bg-muted/30 h-10"
              />
              <Button onClick={handleSend} className="gap-2 shrink-0 h-10 px-6">
                <Send className="h-4 w-4" />
                送信
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
