import { Check, X, Loader2 } from 'lucide-react';
import { useTransactionStore, useScenarioStore, useWalletStore } from '@/stores';
import type { FlowStep } from '@/types';
import { WALLET_PERSONAS } from '@/types';

export function FlowDiagram() {
  const { flowSteps } = useTransactionStore();
  const { currentScenario } = useScenarioStore();
  const { wallets } = useWalletStore();

  const requiredWalletIds = currentScenario.requiredWallets;
  const walletList = requiredWalletIds.map((id) => ({
    id,
    name: WALLET_PERSONAS[id]?.name ?? id,
    emoji: WALLET_PERSONAS[id]?.emoji ?? '👤',
    balance: wallets[id]?.balance,
  }));

  if (flowSteps.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-around">
            {walletList.map((wallet) => (
              <div key={wallet.id} className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-muted text-3xl">
                  {wallet.emoji}
                </div>
                <span className="mt-2 font-medium">{wallet.name}</span>
                <span className="text-sm text-muted-foreground">
                  {wallet.balance?.toLocaleString() ?? '—'} sats
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center text-muted-foreground">
            No flow steps yet. Execute the scenario to see the payment flow.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-around">
          {walletList.map((wallet) => (
            <div key={wallet.id} className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-muted text-3xl">
                {wallet.emoji}
              </div>
              <span className="mt-2 font-medium">{wallet.name}</span>
              <span className="text-sm text-muted-foreground">
                {wallet.balance?.toLocaleString() ?? '—'} sats
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {flowSteps.map((step, index) => (
            <FlowStepRow
              key={step.id}
              step={step}
              index={index}
              walletList={walletList}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FlowStepRowProps {
  step: FlowStep;
  index: number;
  walletList: Array<{ id: string; name: string; emoji: string }>;
}

function FlowStepRow({ step, index, walletList }: FlowStepRowProps) {
  const fromIndex = walletList.findIndex((w) => w.id === step.fromWallet);
  const toIndex = walletList.findIndex((w) => w.id === step.toWallet);

  const isLeftToRight = fromIndex < toIndex;

  return (
    <div className="relative flex items-center justify-center">
      <div className="flex items-center gap-4 rounded-lg border bg-muted/30 px-4 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {index + 1}
        </div>
        <span className="text-sm">
          {WALLET_PERSONAS[step.fromWallet]?.name ?? step.fromWallet}
        </span>
        <div className="flex items-center gap-1">
          {isLeftToRight ? (
            <span className="text-muted-foreground">→</span>
          ) : (
            <span className="text-muted-foreground">←</span>
          )}
        </div>
        <span className="text-sm">
          {WALLET_PERSONAS[step.toWallet]?.name ?? step.toWallet}
        </span>
        <span className="text-sm text-muted-foreground">{step.label}</span>
        <StepStatusIcon status={step.status} />
      </div>
    </div>
  );
}

function StepStatusIcon({ status }: { status: FlowStep['status'] }) {
  switch (status) {
    case 'success':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'error':
      return <X className="h-4 w-4 text-destructive" />;
    case 'pending':
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
}
