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
import { Send, Trash2, ArrowUp, Info } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
  type: "TX" | "INFO";
  data: Uint8Array | string;
  timestamp: Date;
};

export default function SendModeTab() {
  const { t } = useTranslation();
  const { port } = useSerial();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendAsHex, setSendAsHex] = useState(false);
  const [appendCrLf, setAppendCrLf] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (type: "TX" | "INFO", data: Uint8Array | string) => {
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

  const handleSend = async () => {
    if (!port || !port.writable) {
      toast.error(t("messages.port_not_connected_or_unwritable", "Port is not connected or not writable."));
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
      toast.error(t("messages.input_data_error", { message: err.message, defaultValue: `Input Error: ${err.message}` }));
      return;
    }

    try {
      const writer = port.writable.getWriter();
      await writer.write(payload);
      writer.releaseLock();

      addLog("TX", payload);
    } catch (err: any) {
      console.error("Write error:", err);
      toast.error(t("messages.send_error", { message: err.message, defaultValue: `Send Error: ${err.message}` }));
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
    <div className="flex flex-col h-full text-left overflow-hidden">
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-4 flex items-start gap-3 shrink-0 mb-4">
        <Info className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-purple-600 dark:text-purple-400">
          <p className="font-semibold mb-1">{t("send_mode.warning_title", "WOR (Wake On Radio) Send Mode")}</p>
          <p>
            {t("send_mode.warning_desc_1", "To use this mode, configure the E220 module with")} 
            <strong>{t("send_mode.warning_desc_m0", "M0 pin LOW (0)")}</strong>{" and "}<strong>{t("send_mode.warning_desc_m1", "M1 pin HIGH (1)")}</strong>
            {t("send_mode.warning_desc_2", ".")}
            <br />
            {t("send_mode.warning_desc_3", "It performs a WOR transmission (wake-up transmission), waking up the sleeping receiver before sending the data.")}
          </p>
        </div>
      </div>

      <Card className="flex flex-col flex-1 overflow-hidden shadow-none border-border">
        <CardHeader className="pb-4 shrink-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t("send_mode.title", "WOR Send Mode")}</CardTitle>
            <CardDescription>
              {t("send_mode.description", "Sends data with a preamble to wake up a sleeping receiver (WOR Receive Mode).")}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t("send_mode.clear_log", "Clear Logs")}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 overflow-hidden space-y-4 pt-0">
          {/* Sender Area */}
          <div className="shrink-0 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold">{t("send_mode.data_transmission", "Send Data")}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="tx-send-hex"
                    checked={sendAsHex}
                    onCheckedChange={setSendAsHex}
                  />
                  <Label
                    htmlFor="tx-send-hex"
                    className="text-xs cursor-pointer"
                  >
                    {t("send_mode.interpret_as_hex", "Interpret as Hex")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="tx-append-crlf"
                    checked={appendCrLf}
                    onCheckedChange={setAppendCrLf}
                  />
                  <Label
                    htmlFor="tx-append-crlf"
                    className="text-xs cursor-pointer"
                  >
                    {t("send_mode.append_crlf", "Append CRLF")}
                  </Label>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={
                  sendAsHex
                    ? t("send_mode.placeholder_hex", "Enter hex values (e.g. 0A 1B 2C)...")
                    : t("send_mode.placeholder_text", "Enter text (Alphanumeric)...")
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 font-mono text-base bg-muted/30 h-10"
              />
              <Button onClick={handleSend} className="gap-2 shrink-0 h-10 px-6">
                <Send className="h-4 w-4" />
                {t("send_mode.send", "Send")}
              </Button>
            </div>
          </div>

          {/* Log Area */}
          <div className="flex flex-col flex-1 overflow-hidden space-y-2">
            <div className="flex items-center justify-between px-1 shrink-0 mt-2">
              <span className="text-sm font-semibold">{t("send_mode.transmission_history", "Transmission History")}</span>
            </div>

            <ScrollArea
              ref={scrollRef}
              className="flex-1 w-full rounded-md border bg-muted/30 p-4"
            >
              <div className="flex flex-col">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("send_mode.no_history", "No history found.")}
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
        </CardContent>
      </Card>
    </div>
  );
}
