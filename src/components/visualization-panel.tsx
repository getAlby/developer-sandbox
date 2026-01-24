import { FileText, GitBranch, LineChart, Code2, Rocket } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionLog, FlowDiagram, BalanceChart, CodeSnippets, ProductionWallet } from "./visualizations";
import { useUIStore } from "@/stores";

export function VisualizationPanel() {
  const { visualizationTab, setVisualizationTab } = useUIStore();

  return (
    <Tabs
      value={visualizationTab}
      onValueChange={(value) => setVisualizationTab(value as typeof visualizationTab)}
      className="flex h-full flex-col py-4"
    >
      <TabsList className="mx-4 w-fit">
        <TabsTrigger value="log" className="gap-2">
          <FileText className="h-4 w-4" />
          Log
        </TabsTrigger>
        <TabsTrigger value="flow" className="gap-2">
          <GitBranch className="h-4 w-4" />
          Flow Diagram
        </TabsTrigger>
        <TabsTrigger value="chart" className="gap-2">
          <LineChart className="h-4 w-4" />
          Balance Chart
        </TabsTrigger>
        <TabsTrigger value="snippets" className="gap-2">
          <Code2 className="h-4 w-4" />
          Code Snippets
        </TabsTrigger>
        <TabsTrigger value="production" className="gap-2">
          <Rocket className="h-4 w-4" />
          Production Wallet
        </TabsTrigger>
      </TabsList>

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

      <TabsContent value="production" className="mt-0 flex-1 overflow-hidden">
        <ProductionWallet />
      </TabsContent>
    </Tabs>
  );
}
