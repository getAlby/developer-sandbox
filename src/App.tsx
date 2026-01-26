import { useEffect } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import { Layout } from "@/components/layout";
import { GettingStarted } from "@/components/getting-started";
import { ScenarioInfo } from "@/components/scenario-info";
import { ScenarioPanel } from "@/components/scenario-panel";
import { WalletGrid } from "@/components/wallet-grid";
import { VisualizationPanel } from "@/components/visualization-panel";
import { useScenarioStore } from "@/stores";
import { useDevConsole } from "@/hooks/use-dev-console";

function ScenarioRoute() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const setCurrentScenario = useScenarioStore(
    (state) => state.setCurrentScenario,
  );

  useEffect(() => {
    if (scenarioId) {
      setCurrentScenario(scenarioId);
    }
  }, [scenarioId, setCurrentScenario]);

  return (
    <div className="flex h-full flex-col">
      {/* Top section: Scenario info and wallets */}
      <div className="flex-shrink-0 space-y-6 border-b p-6">
        <ScenarioInfo />
        <WalletGrid />
        <ScenarioPanel />
      </div>

      {/* Bottom section: Visualizations */}
      <div className="min-h-0 flex-1">
        <VisualizationPanel />
      </div>
    </div>
  );
}

function App() {
  // Expose wallet clients and Lightning tools on window for browser console use
  useDevConsole();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<GettingStarted />} />
        <Route path="/:scenarioId" element={<ScenarioRoute />} />
      </Routes>
    </Layout>
  );
}

export default App;
