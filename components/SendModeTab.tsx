"use client";

import { useState, useRef, useEffect } from "react";
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
import { Send, Trash2, ArrowUp, AlertCircle, Info } from "lucide-react";

// Helper functions for data conversion
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

function hexToBytes(hexString: string): Uint8Array {
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

type TxLogEntry = {
  id: number;
  timestamp: Date;
  type: "TX" | "INFO";
  data: Uint8Array | string;
};

export default function SendModeTab() {
  const { port } = useSerial();
  const [logs, setLogs] = useState<TxLogEntry[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendAsHex, setSendAsHex] = useState(false);
  const [appendCrLf, setAppendCrLf] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextLogId = useRef(0);

  const addLog = (type: "TX" | "INFO", data: Uint8Array | string) => {
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
    } catch (err: any) {
      console.error("Write error:", err);
      alert(`送信エラー: ${err.message}`);
      addLog("INFO", `送信エラー: ${err.message}`);
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

  const formatData = (data: Uint8Array | string) => {
    if (typeof data === "string") return data;
    if (sendAsHex) {
      return bytesToHex(data);
    } else {
      return textDecoder.decode(data).replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ".");
    }
  };

  return (
    <div className="mt-4 space-y-6 text-left">
      {/* Warning Banner for WOR Send Mode */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-md p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-indigo-600 dark:text-indigo-400">
          <p className="font-semibold mb-1">WOR (Wake On Radio) 送信モード</p>
          <p>
            このモードを使用するには、E220モジュールの{" "}
            <strong className="bg-indigo-500/20 px-1 rounded">
              M0ピンを LOW(0)
            </strong>
            、{" "}
            <strong className="bg-indigo-500/20 px-1 rounded">
              M1ピンを HIGH(1)
            </strong>{" "}
            に設定してください。
            <br />
            WOR送信（ウェイクアップ送信）を行い、スリープ状態の相手を起動させてからデータを送信します。
          </p>
        </div>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">WOR送信モード</CardTitle>
            <CardDescription>
              スリープ状態の受信機（WOR受信モード）を起こすためのプリアンブルを付与して送信します。
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
          {/* Sender Area */}
          <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm font-semibold">データ送信</span>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="send-hex-wor"
                    checked={sendAsHex}
                    onCheckedChange={(checked) => {
                      setSendAsHex(checked);
                      setInputMessage(""); // Clear input on mode switch to prevent invalid format
                    }}
                  />
                  <Label
                    htmlFor="send-hex-wor"
                    className="text-xs cursor-pointer"
                  >
                    Hex(16進数)として解釈
                  </Label>
                </div>
                {!sendAsHex && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="append-crlf-wor"
                      checked={appendCrLf}
                      onCheckedChange={setAppendCrLf}
                    />
                    <Label
                      htmlFor="append-crlf-wor"
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
                    : "送信するテキストを入力 (半角英数字)..."
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

          {/* TX Log Area */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold">送信履歴</span>
            </div>

            <ScrollArea
              ref={scrollRef}
              className="h-[200px] w-full rounded-md border bg-muted/50 p-4"
            >
              <div className="space-y-2 font-mono text-sm">
                {!port && (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    シリアルポートに接続していません。
                  </div>
                )}
                {logs.length === 0 && port && (
                  <div className="text-muted-foreground">
                    送信履歴はありません。
                  </div>
                )}
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 border-b border-border/50 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0 ${
                      log.type === "TX"
                        ? "text-blue-500"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground mt-0.5 shrink-0">
                      [{log.timestamp.toLocaleTimeString()}]
                    </span>
                    <span className="shrink-0 mt-0.5">
                      {log.type === "TX" ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
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
