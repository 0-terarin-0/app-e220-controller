"use client";

import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import NormalModeTab from "@/components/NormalModeTab";
import SettingsModeTab from "@/components/SettingsModeTab";
import ReceiveModeTab from "@/components/ReceiveModeTab";
import SendModeTab from "@/components/SendModeTab";

export default function Tabs() {
  return (
    <ShadcnTabs defaultValue="normal" className="flex flex-col h-full w-full">
      <TabsList className="grid w-full grid-cols-4 shrink-0">
        <TabsTrigger value="normal">通常モード</TabsTrigger>
        <TabsTrigger value="settings">設定モード</TabsTrigger>
        <TabsTrigger value="receive">受信モード</TabsTrigger>
        <TabsTrigger value="send">送信モード</TabsTrigger>
      </TabsList>

      <div className="flex-1 mt-4 overflow-hidden relative">
        <TabsContent
          value="normal"
          className="absolute inset-0 m-0 data-[state=inactive]:hidden"
        >
          <NormalModeTab />
        </TabsContent>
        <TabsContent
          value="settings"
          className="absolute inset-0 m-0 data-[state=inactive]:hidden overflow-y-auto pr-2 pb-4"
        >
          <SettingsModeTab />
        </TabsContent>
        <TabsContent
          value="receive"
          className="absolute inset-0 m-0 data-[state=inactive]:hidden"
        >
          <ReceiveModeTab />
        </TabsContent>
        <TabsContent
          value="send"
          className="absolute inset-0 m-0 data-[state=inactive]:hidden overflow-y-auto pr-2 pb-4"
        >
          <SendModeTab />
        </TabsContent>
      </div>
    </ShadcnTabs>
  );
}
