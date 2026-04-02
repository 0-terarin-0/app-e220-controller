"use client";

import { useState } from "react";
import { useSerial } from "@/contexts/SerialContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Download, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsModeTab() {
  const { port } = useSerial();

  // --- State variables for all E220 registers ---
  // ADDH, ADDL
  const [address, setAddress] = useState("0x0000");

  // REG0
  const [uartBaudRate, setUartBaudRate] = useState("9600");
  const [uartParity, setUartParity] = useState("8N1");
  const [airDataRate, setAirDataRate] = useState("2.4");

  // REG1
  const [subPacketSize, setSubPacketSize] = useState("200");
  const [ambientNoiseRssi, setAmbientNoiseRssi] = useState(false);
  const [transmitPower, setTransmitPower] = useState("22");

  // REG2
  const [channel, setChannel] = useState("15");

  // REG3
  const [rssiByteEnable, setRssiByteEnable] = useState(false);
  const [transmissionMethod, setTransmissionMethod] = useState("transparent");
  const [lbtEnable, setLbtEnable] = useState(false);
  const [worCycle, setWorCycle] = useState("2000");

  // Crypto Keys
  const [cryptoKey, setCryptoKey] = useState("0x0000");

  const [isLoading, setIsLoading] = useState(false);

  const handleReadSettings = async () => {
    if (!port) {
      toast.error(
        "シリアルポートが接続されていません。先にConnectしてください。",
      );
      return;
    }

    if (!port.readable || !port.writable) {
      toast.error("ポートの読み書きができません。");
      return;
    }

    setIsLoading(true);
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // 1. Send Read Command: C1 00 09 (Read registers starting from 0, length 9)
      const writer = port.writable.getWriter();
      const command = new Uint8Array([0xc1, 0x00, 0x09]);
      await writer.write(command);
      writer.releaseLock();

      // 2. Read 12 bytes of response (Command + Start Addr + Length + 9 bytes data)
      reader = port.readable.getReader();
      let buffer = new Uint8Array(0);

      const readPromise = new Promise<Uint8Array>(async (resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              "読み取りタイムアウト。\nE220のM0とM1ピンがHIGH(1)になっているか確認してください。\nまた、設定モードの通信速度は9600bps固定です。",
            ),
          );
        }, 3000);

        try {
          while (buffer.length < 12) {
            const { value, done } = await reader!.read();
            if (done) break;
            if (value) {
              const newBuffer = new Uint8Array(buffer.length + value.length);
              newBuffer.set(buffer);
              newBuffer.set(value, buffer.length);
              buffer = newBuffer;
            }
          }
          resolve(buffer);
        } catch (err) {
          reject(err);
        }
      });

      const data = await readPromise;

      // 3. Parse Data
      // Response format: C1 00 09 ADDH ADDL REG0 REG1 REG2 REG3 CRYPTH CRYPTL
      if (
        data.length >= 12 &&
        data[0] === 0xc1 &&
        data[1] === 0x00 &&
        data[2] === 0x09
      ) {
        const addh = data[3];
        const addl = data[4];
        const reg0 = data[5];
        const reg1 = data[6];
        const reg2 = data[7];
        const reg3 = data[8];
        const cryptH = data[9];
        const cryptL = data[10];

        // --- Address (ADDH, ADDL) ---
        setAddress(
          `0x${((addh << 8) | addl).toString(16).padStart(4, "0").toUpperCase()}`,
        );

        // --- REG0: UART & Air Data Rate ---
        // UART BaudRate (bit 7-5)
        const baudBits = (reg0 >> 5) & 0x07;
        const baudMap = [
          "1200",
          "2400",
          "4800",
          "9600",
          "19200",
          "38400",
          "57600",
          "115200",
        ];
        setUartBaudRate(baudMap[baudBits] || "9600");

        // UART Parity (bit 4-3)
        const parityBits = (reg0 >> 3) & 0x03;
        const parityMap = ["8N1", "8O1", "8E1", "8N1"];
        setUartParity(parityMap[parityBits] || "8N1");

        // Air Data Rate (bit 2-0)
        const adrBits = reg0 & 0x07;
        const adrMap = [
          "0.3",
          "1.2",
          "2.4",
          "4.8",
          "9.6",
          "19.2",
          "19.2",
          "19.2",
        ]; // E220 specific limits might apply
        setAirDataRate(adrMap[adrBits] || "2.4");

        // --- REG1: Packet Size, Ambient RSSI, Tx Power ---
        // Sub-packet Size (bit 7-6)
        const pktBits = (reg1 >> 6) & 0x03;
        const pktMap = ["200", "128", "64", "32"];
        setSubPacketSize(pktMap[pktBits] || "200");

        // Ambient noise RSSI (bit 5)
        setAmbientNoiseRssi(((reg1 >> 5) & 0x01) === 1);

        // Tx Power (bit 1-0)
        const pwrBits = reg1 & 0x03;
        const pwrMap = ["22", "17", "13", "10"];
        setTransmitPower(pwrMap[pwrBits] || "22");

        // --- REG2: Channel ---
        setChannel(reg2.toString());

        // --- REG3: Advanced options ---
        // RSSI byte enable (bit 7)
        setRssiByteEnable(((reg3 >> 7) & 0x01) === 1);

        // Transmission Method (bit 6)
        setTransmissionMethod(
          ((reg3 >> 6) & 0x01) === 1 ? "fixed" : "transparent",
        );

        // LBT Enable (bit 4)
        setLbtEnable(((reg3 >> 4) & 0x01) === 1);

        // WOR Cycle (bit 2-0)
        const worBits = reg3 & 0x07;
        const worMap = [
          "500",
          "1000",
          "1500",
          "2000",
          "2500",
          "3000",
          "3500",
          "4000",
        ];
        setWorCycle(worMap[worBits] || "2000");

        // --- Crypto Keys ---
        setCryptoKey(
          `0x${((cryptH << 8) | cryptL).toString(16).padStart(4, "0").toUpperCase()}`,
        );

        console.log("Settings successfully read from E220:", data);
      } else {
        throw new Error(
          "不正なデータを受信しました。モジュールが設定モードではない可能性があります。",
        );
      }
    } catch (err: any) {
      toast.error(err.message);
      if (reader) await reader.cancel();
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (reader) reader.releaseLock();
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!port) {
      toast.error(
        "シリアルポートが接続されていません。先にConnectしてください。",
      );
      return;
    }
    if (!port.writable) {
      toast.error("ポートの書き込みができません。");
      return;
    }

    setIsLoading(true);

    try {
      const addrNum = parseInt(address, 16);
      const finalAddr = isNaN(addrNum) ? 0 : addrNum;
      const addh = (finalAddr >> 8) & 0xff;
      const addl = finalAddr & 0xff;

      const baudMap: Record<string, number> = {
        "1200": 0,
        "2400": 1,
        "4800": 2,
        "9600": 3,
        "19200": 4,
        "38400": 5,
        "57600": 6,
        "115200": 7,
      };
      const parityMap: Record<string, number> = {
        "8N1": 0,
        "8O1": 1,
        "8E1": 2,
      };
      const adrMap: Record<string, number> = {
        "0.3": 0,
        "1.2": 1,
        "2.4": 2,
        "4.8": 3,
        "9.6": 4,
        "19.2": 5,
      };
      const reg0 =
        ((baudMap[uartBaudRate] ?? 3) << 5) |
        ((parityMap[uartParity] ?? 0) << 3) |
        (adrMap[airDataRate] ?? 2);

      const pktMap: Record<string, number> = {
        "200": 0,
        "128": 1,
        "64": 2,
        "32": 3,
      };
      const pwrMap: Record<string, number> = {
        "22": 0,
        "17": 1,
        "13": 2,
        "10": 3,
      };
      const reg1 =
        ((pktMap[subPacketSize] ?? 0) << 6) |
        ((ambientNoiseRssi ? 1 : 0) << 5) |
        (pwrMap[transmitPower] ?? 0);

      const cNum = parseInt(channel, 10);
      const reg2 = isNaN(cNum) ? 15 : cNum;

      const worMap: Record<string, number> = {
        "500": 0,
        "1000": 1,
        "1500": 2,
        "2000": 3,
        "2500": 4,
        "3000": 5,
        "3500": 6,
        "4000": 7,
      };
      const reg3 =
        ((rssiByteEnable ? 1 : 0) << 7) |
        ((transmissionMethod === "fixed" ? 1 : 0) << 6) |
        ((lbtEnable ? 1 : 0) << 4) |
        (worMap[worCycle] ?? 3);

      const cryptNum = parseInt(cryptoKey, 16);
      const finalCrypt = isNaN(cryptNum) ? 0 : cryptNum;
      const cryptH = (finalCrypt >> 8) & 0xff;
      const cryptL = finalCrypt & 0xff;

      // C0 = Write command, 00 = Start Address, 08 = Length (8 bytes from ADDH to CRYPTL)
      const command = new Uint8Array([
        0xc0,
        0x00,
        0x08,
        addh,
        addl,
        reg0,
        reg1,
        reg2,
        reg3,
        cryptH,
        cryptL,
      ]);

      const writer = port.writable.getWriter();
      await writer.write(command);
      writer.releaseLock();

      toast.success("モジュールに設定を書き込みました。");
    } catch (err: any) {
      console.error("Error writing settings:", err);
      toast.error(`設定の書き込みに失敗しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full text-left overflow-hidden">
      {/* Fixed Header Section */}
      <div className="shrink-0 space-y-4 pb-4">
        {/* Warning Banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-600 dark:text-amber-400">
            <p className="font-semibold mb-1">設定の読み書き時の注意</p>
            <p>
              E220モジュールの設定を操作するには、モジュールの{" "}
              <strong>M0ピン と M1ピン の両方を HIGH(1)</strong>{" "}
              にして設定モードにする必要があります。また、この状態ではモジュール内部のボーレートは{" "}
              <strong>9600 bps に固定</strong>されます。
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleReadSettings}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            モジュールから読み込む
          </Button>
          <Button
            className="gap-2"
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            モジュールへ書き込む
          </Button>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <ScrollArea className="flex-1 w-full rounded-md border bg-muted/10 p-0 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-0 pb-6">
          {/* Basic Configuration */}
          <Card className="shadow-none border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                基本設定 (Address & Channel)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">モジュールアドレス (ADDH, ADDL)</Label>
                <Input
                  id="address"
                  placeholder="0x0000"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Hexフォーマット: 0x0000 - 0xFFFF
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">通信チャンネル (REG2)</Label>
                <Input
                  id="channel"
                  type="number"
                  placeholder="15"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  0 - 83 (通信周波数: 400M + CH * 1M)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crypto">暗号化キー (CRYPT)</Label>
                <Input
                  id="crypto"
                  placeholder="0x0000"
                  value={cryptoKey}
                  onChange={(e) => setCryptoKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Hexフォーマット: 0x0000 - 0xFFFF (Write-only usually)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* REG0: UART & RF Rate */}
          <Card className="shadow-none border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">通信速度 (REG0)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>UART ボーレート</Label>
                  <Select value={uartBaudRate} onValueChange={setUartBaudRate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Baud Rate" />
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
                <div className="space-y-2">
                  <Label>UART パリティ</Label>
                  <Select value={uartParity} onValueChange={setUartParity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Parity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8N1">8N1 (None)</SelectItem>
                      <SelectItem value="8O1">8O1 (Odd)</SelectItem>
                      <SelectItem value="8E1">8E1 (Even)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>エアデータレート (Air Data Rate)</Label>
                <Select value={airDataRate} onValueChange={setAirDataRate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Data Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.3">0.3 kbps (最長距離)</SelectItem>
                    <SelectItem value="1.2">1.2 kbps</SelectItem>
                    <SelectItem value="2.4">2.4 kbps (デフォルト)</SelectItem>
                    <SelectItem value="4.8">4.8 kbps</SelectItem>
                    <SelectItem value="9.6">9.6 kbps</SelectItem>
                    <SelectItem value="19.2">19.2 kbps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* REG1: Transmission Settings */}
          <Card className="shadow-none border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">パケット & 出力 (REG1)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>サブパケットサイズ</Label>
                <Select value={subPacketSize} onValueChange={setSubPacketSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Packet Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="200">200 bytes</SelectItem>
                    <SelectItem value="128">128 bytes</SelectItem>
                    <SelectItem value="64">64 bytes</SelectItem>
                    <SelectItem value="32">32 bytes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>アンビエントノイズ RSSI 出力</Label>
                <Switch
                  checked={ambientNoiseRssi}
                  onCheckedChange={setAmbientNoiseRssi}
                />
              </div>
              <div className="space-y-2">
                <Label>送信出力 (Tx Power)</Label>
                <Select value={transmitPower} onValueChange={setTransmitPower}>
                  <SelectTrigger>
                    <SelectValue placeholder="Power" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="22">22 dBm</SelectItem>
                    <SelectItem value="17">17 dBm</SelectItem>
                    <SelectItem value="13">13 dBm</SelectItem>
                    <SelectItem value="10">10 dBm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* REG3: Advanced Options */}
          <Card className="shadow-none border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">高度な設定 (REG3)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>RSSI バイト付与 (受信パケット)</Label>
                <Switch
                  checked={rssiByteEnable}
                  onCheckedChange={setRssiByteEnable}
                />
              </div>
              <div className="space-y-2">
                <Label>送信モード</Label>
                <Select
                  value={transmissionMethod}
                  onValueChange={setTransmissionMethod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Transmission Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transparent">
                      トランスペアレント送信 (透過)
                    </SelectItem>
                    <SelectItem value="fixed">
                      Fixed送信 (固定アドレス)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>LBT (Listen Before Talk) 有効</Label>
                <Switch checked={lbtEnable} onCheckedChange={setLbtEnable} />
              </div>
              <div className="space-y-2">
                <Label>WOR サイクル (Wake-on-Radio)</Label>
                <Select value={worCycle} onValueChange={setWorCycle}>
                  <SelectTrigger>
                    <SelectValue placeholder="WOR Cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">500 ms</SelectItem>
                    <SelectItem value="1000">1000 ms</SelectItem>
                    <SelectItem value="1500">1500 ms</SelectItem>
                    <SelectItem value="2000">2000 ms (デフォルト)</SelectItem>
                    <SelectItem value="2500">2500 ms</SelectItem>
                    <SelectItem value="3000">3000 ms</SelectItem>
                    <SelectItem value="3500">3500 ms</SelectItem>
                    <SelectItem value="4000">4000 ms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
