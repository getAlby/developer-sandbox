import { FileText, GitBranch, LineChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionLog, FlowDiagram, BalanceChart } from "./visualizations";

export function VisualizationPanel() {
  return (
    <Tabs defaultValue="log" className="flex h-full flex-col py-4">
      <TabsList className="mx-4 w-fit">
        <TabsTrigger value="log" className="gap-2">
          <FileText className="h-4 w-4" />
          Log
        </TabsTrigger>
        {/*FIXME: doesn't work well */}
        {/* <TabsTrigger value="flow" className="gap-2">
          <GitBranch className="h-4 w-4" />
          Flow Diagram
        </TabsTrigger> */}
        <TabsTrigger value="chart" className="gap-2">
          <LineChart className="h-4 w-4" />
          Balance Chart
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
    </Tabs>
  );
}
