"use client";

import { useState } from "react";
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
import { Plug, PlugZap, AlertTriangle } from "lucide-react";

export default function SerialConnectButton() {
  const { port, error, portInfo, connect, disconnect } = useSerial();
  const [baudRate, setBaudRate] = useState<string>("9600");

  const handleConnect = () => {
    connect(parseInt(baudRate, 10));
  };

  const getStatus = () => {
    if (error) {
      return (
        <Badge
          variant="destructive"
          className="flex items-center gap-2 px-4 py-2 text-sm"
        >
          <AlertTriangle className="h-5 w-5" />
          Error
        </Badge>
      );
    }
    if (port) {
      return (
        <Badge className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white">
          <Plug className="h-5 w-5" />
          Connected
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="flex items-center gap-2 px-4 py-2 text-sm"
      >
        <PlugZap className="h-5 w-5" />
        Disconnected
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-3 w-full items-center gap-4">
      <div className="flex justify-end">{getStatus()}</div>

      {port && portInfo && (
        <div className="flex justify-center">
          <div className="text-sm text-muted-foreground font-mono bg-muted px-4 py-2 rounded-md border flex items-center">
            VID:{" "}
            {portInfo.vid
              ? `0x${portInfo.vid.toString(16).padStart(4, "0")}`
              : "N/A"}{" "}
            PID:{" "}
            {portInfo.pid
              ? `0x${portInfo.pid.toString(16).padStart(4, "0")}`
              : "N/A"}
          </div>
        </div>
      )}

      {!port && (
        <div className="flex justify-center">
          <Select value={baudRate} onValueChange={setBaudRate}>
            <SelectTrigger className="w-[130px] h-11 px-4 text-base">
              <SelectValue placeholder="Baudrate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1200">1200 bps</SelectItem>
              <SelectItem value="2400">2400 bps</SelectItem>
              <SelectItem value="4800">4800 bps</SelectItem>
              <SelectItem value="9600">9600 bps</SelectItem>
              <SelectItem value="19200">19200 bps</SelectItem>
              <SelectItem value="38400">38400 bps</SelectItem>
              <SelectItem value="57600">57600 bps</SelectItem>
              <SelectItem value="115200">115200 bps</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-start">
        {!port ? (
          <Button
            onClick={handleConnect}
            size="lg"
            className="h-11 px-6 text-base"
          >
            Connect to E220
          </Button>
        ) : (
          <Button
            onClick={disconnect}
            variant="destructive"
            size="lg"
            className="h-11 px-6 text-base"
          >
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
}
