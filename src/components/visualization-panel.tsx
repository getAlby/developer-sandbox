import {
  FileText,
  GitBranch,
  LineChart,
  Code2,
  MessageSquareText,
  Rocket,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TransactionLog,
  FlowDiagram,
  BalanceChart,
  CodeSnippets,
  PromptsTab,
  ProductionWallet,
} from "./visualizations";
import { useUIStore } from "@/stores";

export function VisualizationPanel() {
  const { visualizationTab, setVisualizationTab } = useUIStore();
  const tabsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tabsListRef.current;
    if (!container) return;
    const activeTab = container.querySelector<HTMLElement>(
      '[data-state="active"]'
    );
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [visualizationTab]);

  return (
    <Tabs
      id="visualization-panel"
      value={visualizationTab}
      onValueChange={(value) =>
        setVisualizationTab(value as typeof visualizationTab)
      }
      className="flex h-full flex-col py-4"
    >
      <div ref={tabsListRef} className="mx-4 overflow-x-auto">
        <TabsList className="w-fit">
          <TabsTrigger value="log" className="gap-2">
            <FileText className="h-4 w-4 shrink-0" />
            Log
          </TabsTrigger>
          <TabsTrigger value="flow" className="gap-2">
            <GitBranch className="h-4 w-4 shrink-0" />
            Flow Diagram
          </TabsTrigger>
          <TabsTrigger value="chart" className="gap-2">
            <LineChart className="h-4 w-4 shrink-0" />
            Balance Chart
          </TabsTrigger>
          <TabsTrigger value="snippets" className="gap-2">
            <Code2 className="h-4 w-4 shrink-0" />
            Code
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <MessageSquareText className="h-4 w-4 shrink-0" />
            Example Prompts
          </TabsTrigger>
          <TabsTrigger value="production" className="gap-2">
            <Rocket className="h-4 w-4 shrink-0" />
            Production
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="log" className="mt-0 flex-1 overflow-hidden">
        <TransactionLog />
      </TabsContent>

      <TabsContent value="flow" className="mt-0 flex-1 overflow-hidden">
        <FlowDiagram />
      </TabsContent>

      <TabsContent value="chart" className="mt-0 flex-1 overflow-hidden">
        <BalanceChart />
      </TabsContent>

      <TabsContent value="snippets" className="mt-0 flex-1 overflow-hidden">
        <CodeSnippets />
      </TabsContent>

      <TabsContent value="prompts" className="mt-0 flex-1 overflow-hidden">
        <PromptsTab />
      </TabsContent>

      <TabsContent value="production" className="mt-0 flex-1 overflow-hidden">
        <ProductionWallet />
      </TabsContent>
    </Tabs>
  );
}
