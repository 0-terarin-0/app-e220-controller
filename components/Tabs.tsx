"use client";

import { useState } from "react";

// Placeholder components for each tab's content
const NormalModeTab = () => <div>通常モードのコンテンツ</div>;
const SettingsModeTab = () => <div>設定モードのコンテンツ</div>;
const ReceiveModeTab = () => <div>受信モードのコンテンツ</div>;
const SendModeTab = () => <div>送信モードのコンテンツ</div>;

type Tab = "normal" | "settings" | "receive" | "send";

const Tabs = () => {
  const [activeTab, setActiveTab] = useState<Tab>("normal");

  const renderContent = () => {
    switch (activeTab) {
      case "normal":
        return <NormalModeTab />;
      case "settings":
        return <SettingsModeTab />;
      case "receive":
        return <ReceiveModeTab />;
      case "send":
        return <SendModeTab />;
      default:
        return null;
    }
  };

  const getButtonClasses = (tabName: Tab) => {
    const isActive = activeTab === tabName;
    return `py-2 px-4 cursor-pointer rounded-t-md mr-1 border ${
      isActive
        ? "bg-background text-primary border-b-transparent -mb-px"
        : "bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground"
    }`;
  };

  return (
    <div className="mt-4">
      <div className="flex border-b border-border">
        <button
          className={getButtonClasses("normal")}
          onClick={() => setActiveTab("normal")}
        >
          通常モード
        </button>
        <button
          className={getButtonClasses("settings")}
          onClick={() => setActiveTab("settings")}
        >
          設定モード
        </button>
        <button
          className={getButtonClasses("receive")}
          onClick={() => setActiveTab("receive")}
        >
          受信モード
        </button>
        <button
          className={getButtonClasses("send")}
          onClick={() => setActiveTab("send")}
        >
          送信モード
        </button>
      </div>
      <div className="p-5 border-x border-b border-border rounded-b-md bg-background">
        {renderContent()}
      </div>
    </div>
  );
};

export default Tabs;
