"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { tauriSerial } from "@/lib/tauri-serial";

type PortInfo = {
  vid?: number;
  pid?: number;
};

interface SerialContextType {
  port: any | null;
  error: string | null;
  portInfo: PortInfo | null;
  connect: (baudRate: number) => Promise<void>;
  disconnect: () => Promise<void>;
}

const SerialContext = createContext<SerialContextType | undefined>(undefined);

export function SerialProvider({ children }: { children: ReactNode }) {
  const [port, setPort] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portInfo, setPortInfo] = useState<PortInfo | null>(null);

  const connect = async (baudRate: number) => {
    try {
      setError(null);

      const isTauriEnv =
        typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
      let requestedPort: any;

      if (isTauriEnv) {
        requestedPort = await tauriSerial.requestPort();
        await requestedPort.open({ baudRate });
      } else {
        if (!("serial" in navigator)) {
          throw new Error(
            "This Browser is not compatible. Please use Chromium-based browsers or the Tauri app.",
          );
        }

        requestedPort = await (navigator as any).serial.requestPort();
        await requestedPort.open({ baudRate });
      }

      setPort(requestedPort);

      const info = await requestedPort.getInfo();
      if (info) {
        setPortInfo({ vid: info.usbVendorId, pid: info.usbProductId });
      }

      console.log(`Connected with E220 at ${baudRate} bps`);
    } catch (err: any) {
      console.error("Error while connecting:", err);
      setError(err.message);
    }
  };

  const disconnect = async () => {
    if (port) {
      try {
        await port.close();
      } catch (err) {
        console.error("Error closing port:", err);
      } finally {
        setPort(null);
        setPortInfo(null);
        console.log("Disconnected.");
      }
    }
  };

  return (
    <SerialContext.Provider
      value={{
        port,
        error,
        portInfo,
        connect,
        disconnect,
      }}
    >
      {children}
    </SerialContext.Provider>
  );
}

export function useSerial() {
  const context = useContext(SerialContext);
  if (context === undefined) {
    throw new Error("useSerial must be used within a SerialProvider");
  }
  return context;
}
