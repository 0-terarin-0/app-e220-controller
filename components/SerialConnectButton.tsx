"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSerial } from "@/contexts/SerialContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plug, PlugZap, AlertTriangle, Settings2 } from "lucide-react";

export default function SerialConnectButton() {
  const { t } = useTranslation();
  const { port, error, portInfo, connect, disconnect } = useSerial();
  const [baudRate, setBaudRate] = useState<string>("9600");
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");

  const isTauriEnv =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  useEffect(() => {
    if (isTauriEnv) {
      import("@/lib/tauri-serial").then(({ tauriSerial }) => {
        tauriSerial.getPorts().then((p) => {
          const paths = p.map((port) => port.path);
          setPorts(paths);
          if (paths.length > 0) setSelectedPort(paths[0]);
        });
      });
    }
  }, [isTauriEnv]);

  const handleConnect = async () => {
    if (isTauriEnv && selectedPort) {
      const { tauriSerial, TauriSerialPort } =
        await import("@/lib/tauri-serial");
      const { SerialPort } = await import("tauri-plugin-serialplugin-api");

      const originalRequestPort = tauriSerial.requestPort;
      tauriSerial.requestPort = async () => {
        const available = await SerialPort.available_ports();
        const info = available[selectedPort];
        if (!info) throw new Error("Selected port not found");
        return new TauriSerialPort(selectedPort, info);
      };

      try {
        await connect(parseInt(baudRate, 10));
      } finally {
        tauriSerial.requestPort = originalRequestPort;
      }
    } else {
      connect(parseInt(baudRate, 10));
    }
  };

  return (
    <div className="flex w-full items-center justify-between gap-4">
      {/* Left side: Status and Info */}
      <div className="flex items-center gap-3">
        {error ? (
          <Badge
            variant="destructive"
            className="flex items-center gap-1.5 px-3 py-1 shadow-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{t("toolbar.connection_error", "Connection Error")}</span>
          </Badge>
        ) : port ? (
          <Badge className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm text-white">
            <Plug className="h-4 w-4" />
            <span>{t("toolbar.connected", "Connected")}</span>
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 px-3 py-1 shadow-sm"
          >
            <PlugZap className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {t("toolbar.disconnected", "Disconnected")}
            </span>
          </Badge>
        )}

        {port && portInfo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/50 px-3 py-1 rounded-md border border-border/50">
            <span className="font-semibold text-foreground/70">VID:</span>
            {portInfo.vid
              ? `0x${portInfo.vid.toString(16).padStart(4, "0").toUpperCase()}`
              : "N/A"}
            <span className="text-border mx-1">|</span>
            <span className="font-semibold text-foreground/70">PID:</span>
            {portInfo.pid
              ? `0x${portInfo.pid.toString(16).padStart(4, "0").toUpperCase()}`
              : "N/A"}
          </div>
        )}
      </div>

      {/* Right side: Controls */}
      <div className="flex items-center gap-3">
        {!port && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded-md border border-border/50">
              <Settings2 className="h-4 w-4 text-muted-foreground ml-1" />
              {isTauriEnv && (
                <Select value={selectedPort} onValueChange={setSelectedPort}>
                  <SelectTrigger className="w-[140px] h-8 text-sm border-none bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none">
                    <SelectValue placeholder={t("toolbar.select_port", "Select Port")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ports.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {t("toolbar.no_ports_found", "No ports found")}
                      </SelectItem>
                    ) : (
                      ports.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}

              {isTauriEnv && <div className="w-px h-4 bg-border/80"></div>}

              <Select value={baudRate} onValueChange={setBaudRate}>
                <SelectTrigger className="w-[100px] h-8 text-sm border-none bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none">
                  <SelectValue placeholder={t("toolbar.baudrate", "Baudrate")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1200">1200</SelectItem>
                  <SelectItem value="2400">2400</SelectItem>
                  <SelectItem value="4800">4800</SelectItem>
                  <SelectItem value="9600">9600</SelectItem>
                  <SelectItem value="19200">19200</SelectItem>
                  <SelectItem value="38400">38400</SelectItem>
                  <SelectItem value="57600">57600</SelectItem>
                  <SelectItem value="115200">115200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!port ? (
          <Button
            onClick={handleConnect}
            size="sm"
            className="h-9 px-5 shadow-sm transition-all hover:shadow"
            disabled={isTauriEnv && !selectedPort}
          >
            Connect
          </Button>
        ) : (
          <Button
            onClick={disconnect}
            variant="destructive"
            size="sm"
            className="h-9 px-5 shadow-sm transition-all hover:shadow"
          >
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
}
