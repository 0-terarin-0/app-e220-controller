"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
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
  const baudRateRef = useRef<number | null>(null);

  const connect = async (baudRate: number) => {
    try {
      setError(null);

      baudRateRef.current = baudRate;
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

  useEffect(() => {
    const isTauriEnv =
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    if (
      !isTauriEnv &&
      typeof navigator !== "undefined" &&
      "serial" in navigator
    ) {
      const handleDisconnect = (e: any) => {
        if (port && e.target === port) {
          console.log("Device disconnected (Web)");
          setPort(null);
          setPortInfo(null);
        }
      };

      const handleConnect = async (e: any) => {
        console.log("Device connected (Web)");
        if (baudRateRef.current && !port) {
          try {
            const ports = await (navigator as any).serial.getPorts();
            if (ports.length > 0) {
              const p = ports[0];
              await p.open({ baudRate: baudRateRef.current });
              setPort(p);
              const info = await p.getInfo();
              if (info) {
                setPortInfo({ vid: info.usbVendorId, pid: info.usbProductId });
              }
            }
          } catch (err) {
            console.error("Auto-reconnect failed:", err);
          }
        }
      };

      (navigator as any).serial.addEventListener(
        "disconnect",
        handleDisconnect,
      );
      (navigator as any).serial.addEventListener("connect", handleConnect);

      return () => {
        (navigator as any).serial.removeEventListener(
          "disconnect",
          handleDisconnect,
        );
        (navigator as any).serial.removeEventListener("connect", handleConnect);
      };
    }
  }, [port]);

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
