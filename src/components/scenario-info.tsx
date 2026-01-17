import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useScenarioStore, useWalletStore } from '@/stores';
import { AlertCircle } from 'lucide-react';

export function ScenarioInfo() {
  const { currentScenario } = useScenarioStore();
  const { areAllWalletsConnected } = useWalletStore();

  const allConnected = areAllWalletsConnected(currentScenario.requiredWallets);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentScenario.icon}</span>
          <h2 className="text-xl font-semibold">{currentScenario.title}</h2>
          <ComplexityBadge complexity={currentScenario.complexity} />
        </div>
        <p className="text-muted-foreground">{currentScenario.description}</p>
      </div>

      {!allConnected && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Connect all required wallets to start this scenario
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-2 text-sm font-medium">Learn</h3>
        <p className="text-sm text-muted-foreground">{currentScenario.education}</p>
      </div>
    </div>
  );
}

function ComplexityBadge({ complexity }: { complexity: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    simplest: 'default',
    simple: 'default',
    medium: 'secondary',
    advanced: 'outline',
  };

  return (
    <Badge variant={variants[complexity] || 'outline'} className="text-xs">
      {complexity}
    </Badge>
  );
}
