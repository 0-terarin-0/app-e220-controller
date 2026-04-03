# E220 Web Controller / Workspace

A modern, cross-platform configuration and testing tool for the **E220 LoRa Module**. 
Built with Next.js, Tailwind CSS, shadcn/ui, and Tauri. 
It runs directly in Chromium-based browsers using the **Web Serial API** or as a standalone **Desktop App** using Tauri.

[English](#english) | [日本語](#japanese)

---

<a id="english"></a>

## 🌟 Features
- **Cross-Platform**: Run in Chrome/Edge directly, or build as a Windows/macOS/Linux Desktop App via Tauri.
- **Normal Mode**: Test data transmission (TX) and reception (RX). Supports Hex/Text payloads and auto-appending CRLF.
- **Settings Mode**: Read and write E220 registers directly. Easily configure Address, Channel, Baud Rate, Air Data Rate, Tx Power, and Advanced WOR settings.
- **WOR (Wake On Radio) Modes**: Dedicated tabs for testing WOR TX (wake-up transmission) and WOR RX (sleep mode reception).
- **Auto-Reconnect**: Intelligently restores the connection if the USB serial port is unplugged and re-plugged.
- **i18n Support**: Seamlessly switch between English and Japanese.
- **Dark/Light Theme**: Built-in toggle for modern eye-friendly themes.

## 🚀 Getting Started

### Prerequisites
- Node.js & Bun installed.
- (For Desktop App) Rust and Tauri prerequisites installed.

### 1. Web Version (Browser)
Run the Next.js development server:
```bash
bun install
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in Chrome/Edge.

### 2. Desktop Version (Tauri)
To run the standalone desktop app:
```bash
bun install
bun tauri dev
```
To build the app:
```bash
bun tauri build
```

---

<a id="japanese"></a>

## 🌟 特徴
- **クロスプラットフォーム対応**: ChromeやEdgeなどのブラウザ（Web Serial API）で直接動かすことも、Tauriを使ってWindows/macOSのデスクトップアプリとして動かすことも可能です。
- **通常モード**: データの送受信（TX/RX）テスト。Hex（16進数）とテキストの相互変換、CRLFの自動付与に対応。
- **設定モード**: E220モジュールのレジスタを直接読み書き。アドレス、チャンネル、ボーレート、出力パワー、WORなどの高度な設定をGUIで簡単に行えます。
- **WOR (Wake On Radio) モード**: 専用タブにて、スリープ状態のモジュールを起こすウェイクアップ送信や、スリープ待機（受信）のテストが可能。
- **自動再接続**: 動作中にUSBが抜かれた場合でも、再度挿し直すだけで自動的に通信ストリームが復旧します。
- **多言語対応**: 英語と日本語を右上のボタンからシームレスに切り替えられます。
- **ダークモード対応**: モダンで目に優しいテーマ切り替え機能を搭載。

## 🚀 使い方

### 事前準備
- Node.js および Bun のインストール
- (デスクトップアプリ版の場合) Rust および Tauriのビルド環境

### 1. Webブラウザ版
開発サーバーを起動します:
```bash
bun install
bun run dev
```
Chrome または Edge で [http://localhost:3000](http://localhost:3000) を開きます。

### 2. デスクトップアプリ版 (Tauri)
デスクトップアプリとして起動する場合:
```bash
bun install
bun tauri dev
```
アプリをビルド（exe/dmgの作成）する場合:
```bash
bun tauri build
```

## 🛠️ E220 ピン設定（M0 / M1）の注意
アプリ上でどの操作を行うかによって、モジュール本体のM0・M1ピンの設定を物理的に切り替える必要があります。

- **通常モード (送受信)**: M0=`0` (LOW), M1=`0` (LOW)
- **設定モード (読込・書込)**: M0=`1` (HIGH), M1=`1` (HIGH)
- **WOR 受信モード**: M0=`1` (HIGH), M1=`0` (LOW)
- **WOR 送信モード**: M0=`0` (LOW), M1=`1` (HIGH)
