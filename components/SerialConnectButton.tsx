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
      console.log("E220と接続完了や！");
    } catch (err: any) {
      console.error("シリアル接続エラー:", err);
      setError(err.message);
    }
  };

  const disconnectSerial = async () => {
    if (port) {
      await port.close();
      setPort(null);
      console.log("切断しました");
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white text-black">
      <h2 className="text-xl font-bold mb-4">E220 接続パネル</h2>

      {!port ? (
        <button
          onClick={connectSerial}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          E220に接続する
        </button>
      ) : (
        <button
          onClick={disconnectSerial}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          切断する
        </button>
      )}

      {port && <p className="mt-4 text-green-600 font-bold">🟢 接続済み</p>}
      {error && <p className="mt-4 text-red-600">❌ エラー: {error}</p>}
    </div>
  );
}
