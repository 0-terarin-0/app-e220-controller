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
    <ShadcnTabs defaultValue="normal" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="normal">通常モード</TabsTrigger>
        <TabsTrigger value="settings">設定モード</TabsTrigger>
        <TabsTrigger value="receive">受信モード</TabsTrigger>
        <TabsTrigger value="send">送信モード</TabsTrigger>
      </TabsList>
      <TabsContent value="normal">
        <NormalModeTab />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsModeTab />
      </TabsContent>
      <TabsContent value="receive">
        <ReceiveModeTab />
      </TabsContent>
      <TabsContent value="send">
        <SendModeTab />
      </TabsContent>
    </ShadcnTabs>
  );
}
