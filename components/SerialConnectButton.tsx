"use client";

import { useState } from "react";

export default function SerialConnectButton() {
  const [port, setPort] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const connectSerial = async () => {
    try {
      setError(null);

      if (!("serial" in navigator)) {
        throw new Error(
          "This Browser is not compatible. Please use Google Chrome, Edge, and other Chromium based browsers.",
        );
      }

      const requestedPort = await navigator.serial.requestPort();

      await requestedPort.open({ baudRate: 9600 });

      setPort(requestedPort);
      console.log("Connected with E220");
    } catch (err: any) {
      console.error("Erroe while connecting:", err);
      setError(err.message);
    }
  };

  const disconnectSerial = async () => {
    if (port) {
      await port.close();
      setPort(null);
      console.log("Disconnected.");
    }
  };

  return (
    <div className="p-4 border-border rounded-lg shadow-sm bg-background text-foreground border">
      <h2 className="text-xl font-bold mb-4">Connect</h2>

      {!port ? (
        <button
          onClick={connectSerial}
          className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded"
        >
          Connect to E220
        </button>
      ) : (
        <button
          onClick={disconnectSerial}
          className="bg-accent text-accent-foreground font-bold py-2 px-4 rounded"
        >
          Disconnect
        </button>
      )}

      {port && <p className="mt-4 text-green-600 font-bold">🟢 Connected</p>}
      {error && <p className="mt-4 text-red-600">❌ Error: {error}</p>}
    </div>
  );
}
