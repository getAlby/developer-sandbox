import { Check, X, Loader2 } from "lucide-react";
import {
  useTransactionStore,
  useScenarioStore,
  useWalletStore,
} from "@/stores";
import type { FlowStep } from "@/types";
import { WALLET_PERSONAS } from "@/types";

export function FlowDiagram() {
  const { flowSteps } = useTransactionStore();
  const { currentScenario } = useScenarioStore();
  const { wallets } = useWalletStore();

  const requiredWalletIds = currentScenario.requiredWallets;
  const walletList = requiredWalletIds.map((id) => ({
    id,
    name: WALLET_PERSONAS[id]?.name ?? id,
    emoji: WALLET_PERSONAS[id]?.emoji ?? "👤",
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
                  {wallet.balance?.toLocaleString() ?? "—"} sats
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
                {wallet.balance?.toLocaleString() ?? "—"} sats
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
  if (!walletList.length) {
    return null;
  }
  const fromIndex = walletList.findIndex((w) => w.id === step.fromWallet);
  const toIndex = walletList.findIndex((w) => w.id === step.toWallet);

  if (fromIndex < 0 || toIndex < 0) {
    return null;
  }

  // Calculate horizontal position based on wallet positions
  // Use percentage-based positioning: left wallet at 16.66%, right at 83.34% for 6 wallets
  const walletCount = walletList.length || 1;
  const stepWidth = 100 / walletCount;

  // Position the step in the middle of the two wallets
  const leftWallet = Math.min(fromIndex, toIndex);
  const rightWallet = Math.max(fromIndex, toIndex);
  const leftPosition = leftWallet * stepWidth + stepWidth / 2;
  const rightPosition = rightWallet * stepWidth + stepWidth / 2;
  const centerPosition = (leftPosition + rightPosition) / 2;

  // Determine flow direction for arrow head
  const isLeftToRight = step.direction === "right"; //fromIndex < toIndex;

  return (
    <div className="relative h-12 w-full">
      {/* Draw arrow line between wallets */}
      <div
        className="absolute top-5 h-0.5 bg-border"
        style={{
          left: `${leftPosition}%`,
          right: `${100 - rightPosition}%`,
        }}
      />

      {/* Arrow head at the destination wallet end */}
      <div
        className="absolute top-4"
        style={{
          left: isLeftToRight ? `${rightPosition}%` : `${leftPosition}%`,
          transform: isLeftToRight ? "rotate(0deg)" : "rotate(180deg)",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 6L10 6M10 6L5 2M10 6L5 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-border"
          />
        </svg>
      </div>

      {/* Step indicator at the center */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 transform"
        style={{
          left: `${centerPosition}%`,
          width: stepWidth * Math.max(rightWallet - leftWallet, 1) + "%",
        }}
      >
        <div className="flex flex-col items-center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
            {index + 1}
          </div>
          <div
            className="mt-1 flex flex-1 w-full items-center gap-1 rounded border bg-background px-2 py-1 shadow-sm"
            style={{ width: 100 + "%" }}
          >
            <span className="text-xs font-medium">
              {WALLET_PERSONAS[walletList[leftWallet].id]?.name ??
                walletList[leftWallet]?.id}
            </span>
            {rightWallet !== leftWallet && (
              <>
                <span className="text-muted-foreground">
                  {isLeftToRight ? "→" : "←"}
                </span>
                <span className="text-xs font-medium">
                  {WALLET_PERSONAS[walletList[rightWallet].id]?.name ??
                    walletList[rightWallet]?.id}
                </span>
              </>
            )}
            <span className="ml-1 text-xs text-muted-foreground">
              {step.label}
            </span>
            <StepStatusIcon status={step.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepStatusIcon({ status }: { status: FlowStep["status"] }) {
  switch (status) {
    case "success":
      return <Check className="h-4 w-4 text-green-500" />;
    case "error":
      return <X className="h-4 w-4 text-destructive" />;
    case "pending":
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
}
