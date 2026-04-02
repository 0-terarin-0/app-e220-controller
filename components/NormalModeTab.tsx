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

type LogEntry = {
  id: number;
  timestamp: Date;
  type: "RX" | "TX" | "INFO";
  data: Uint8Array | string;
};

export default function NormalModeTab() {
  const { port } = useSerial();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [viewAsHex, setViewAsHex] = useState(false);
  const [sendAsHex, setSendAsHex] = useState(false);
  const [appendCrLf, setAppendCrLf] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextLogId = useRef(0);

  const addLog = (type: "RX" | "TX" | "INFO", data: Uint8Array | string) => {
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
      alert("ポートが接続されていないか、書き込みできません。");
      return;
    }
    if (!inputMessage.trim()) return;

    let payload: Uint8Array;

    try {
      if (sendAsHex) {
        payload = hexToBytes(inputMessage);
      } else {
        const text = inputMessage + (appendCrLf ? "\r\n" : "");
        payload = textEncoder.encode(text);
      }
    } catch (err: any) {
      alert(`送信データの変換エラー: ${err.message}`);
      return;
    }

    try {
      const writer = port.writable.getWriter();
      await writer.write(payload);
      writer.releaseLock();

      addLog("TX", payload);
      // Optional: clear input after send
      // setInputMessage("");
    } catch (err: any) {
      console.error("Write error:", err);
      alert(`送信エラー: ${err.message}`);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (sendAsHex) {
      // 16進数モード: 0-9, A-F, a-f, スペースのみ許可
      setInputMessage(value.replace(/[^0-9A-Fa-f ]/g, ""));
    } else {
      // テキストモード: 半角英数字・記号 (ASCII 0x20-0x7E) のみ許可
      setInputMessage(value.replace(/[^\x20-\x7E]/g, ""));
    }
  };

  const formatData = (data: Uint8Array | string) => {
    if (typeof data === "string") return data;
    if (viewAsHex) {
      return bytesToHex(data);
    } else {
      // Replace unprintable characters with a dot or standard replacement to avoid UI breaks
      return textDecoder.decode(data).replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ".");
    }
  };

  return (
    <div className="mt-4 space-y-4 text-left">
      <Card className="shadow-none border-border">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
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
        <CardContent className="space-y-4">
          {/* Receiver / Log Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold">通信ログ</span>
              <div className="flex items-center gap-2">
                <Switch
                  id="view-hex"
                  checked={viewAsHex}
                  onCheckedChange={setViewAsHex}
                />
                <Label htmlFor="view-hex" className="text-xs cursor-pointer">
                  Hex(16進数)で表示
                </Label>
              </div>
            </div>

            <ScrollArea
              ref={scrollRef}
              className="h-[300px] w-full rounded-md border bg-muted/50 p-4"
            >
              <div className="space-y-2 font-mono text-sm">
                {!port && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    シリアルポートに接続していません。「Connect」ボタンを押してください。
                  </div>
                )}
                {logs.length === 0 && port && (
                  <div className="text-muted-foreground">
                    待機中... データを受信するとここに表示されます。
                  </div>
                )}
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 border-b border-border/50 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0 ${
                      log.type === "TX"
                        ? "text-primary"
                        : log.type === "INFO"
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
                      {log.type === "TX" && (
                        <ArrowUp className="h-4 w-4 text-blue-500" />
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

          {/* Sender Area */}
          <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm font-semibold">データ送信</span>
              <div className="flex items-center gap-6">
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
                {!sendAsHex && (
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
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={
                  sendAsHex
                    ? "例: A1 B2 0C (スペース区切り可)"
                    : "送信するテキストを入力..."
                }
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="font-mono"
              />
              <Button
                onClick={handleSend}
                disabled={!port || !inputMessage.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                送信
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
