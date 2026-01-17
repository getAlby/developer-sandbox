import { Layout } from '@/components/layout';
import { ScenarioInfo } from '@/components/scenario-info';
import { ScenarioPanel } from '@/components/scenario-panel';
import { WalletGrid } from '@/components/wallet-grid';
import { VisualizationPanel } from '@/components/visualization-panel';

function App() {
  return (
    <Layout>
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
    </Layout>
  );
}

export default App;
