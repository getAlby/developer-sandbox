import { useState } from "react";
import {
  Check,
  X,
  Loader2,
  Copy,
  Code2,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Button } from "@/components/ui/button";
import {
  useTransactionStore,
  useScenarioStore,
  useWalletStore,
  useUIStore,
} from "@/stores";
import type { FlowStep } from "@/types";
import { WALLET_PERSONAS } from "@/types";
import { getSnippetsById } from "@/data/code-snippets";

SyntaxHighlighter.registerLanguage('javascript', javascript);

export function FlowDiagram() {
  const { flowSteps, clearFlowSteps } = useTransactionStore();
  const { currentScenario } = useScenarioStore();
  const { wallets } = useWalletStore();

  const requiredWalletIds = currentScenario.requiredWallets || [];
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
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="font-medium">Flow Diagram</h3>
        <Button variant="ghost" size="sm" onClick={clearFlowSteps}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
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

        <div className="relative pt-8 space-y-6 pb-8">
          {/* Vertical lifelines for each wallet */}
          {walletList.map((wallet, idx) => {
            const walletCount = walletList.length || 1;
            const stepWidth = 100 / walletCount;
            const xPosition = idx * stepWidth + stepWidth / 2;
            return (
              <div
                key={`lifeline-${wallet.id}`}
                className="absolute top-0 bottom-0 w-px border-l border-dashed border-muted-foreground/30"
                style={{ left: `${xPosition}%` }}
              />
            );
          })}
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { openCodeSnippetsHelp } = useUIStore();

  if (!walletList.length) {
    return null;
  }
  const fromIndex = walletList.findIndex((w) => w.id === step.fromWallet);
  const toIndex = walletList.findIndex((w) => w.id === step.toWallet);

  if (fromIndex < 0 || toIndex < 0) {
    return null;
  }

  // Get code snippets by explicit IDs
  const snippets = step.snippetIds ? getSnippetsById(step.snippetIds) : [];
  const primarySnippet = snippets[0];

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!primarySnippet) return;
    try {
      await navigator.clipboard.writeText(primarySnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
    <div className={`relative w-full ${isExpanded ? "mb-4" : ""}`}>
      <div className="relative w-full" style={{ minHeight: "4.5rem" }}>
        {/* Draw arrow line between wallets */}
        <div
          className="absolute top-5 h-0.5 bg-border"
          style={{
            left: `${leftPosition}%`,
            right: `${100 - rightPosition}%`,
          }}
        />

        {/* Arrow head at the destination wallet end */}
        {leftWallet !== rightWallet && (
          <div
            className="absolute"
            style={{
              top: "15px",
              left: isLeftToRight
                ? `calc(${rightPosition}% + 2px)`
                : `${leftPosition}%`,
              transform: isLeftToRight
                ? "translateX(-100%)"
                : "translateX(-2px) rotate(180deg)",
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
        )}

        {/* Step indicator at the center */}
        <div
          className="absolute top-1 -translate-x-1/2 transform flex flex-col items-center"
          style={{
            left: `${centerPosition}%`,
          }}
        >
          <div className="h-6 w-6">{/* spacer for arrow */}</div>
          <div
            className="mt-1 flex max-w-[35vw] items-center gap-1 rounded border bg-background px-2 py-1 shadow-sm cursor-pointer hover:bg-muted/30 transition-colors flex-wrap"
            onClick={() => primarySnippet && setIsExpanded(!isExpanded)}
          >
            {primarySnippet && (
              <span className="text-muted-foreground flex items-center gap-0.5">
                <Code2 className="h-3 w-3" />
              </span>
            )}
            <span className="text-xs text-muted-foreground">{index + 1}</span>
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

      {/* Expanded code snippet */}
      {isExpanded && primarySnippet && (
        <div className="flex justify-center mt-6 px-2">
          <div className="w-full max-w-[480px] border rounded-md bg-muted/30 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b">
              <span className="text-xs font-medium">
                {primarySnippet.title}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCodeSnippetsHelp();
                  }}
                  title="View all code snippets"
                >
                  <HelpCircle className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="p-3 overflow-x-auto">
              <SyntaxHighlighter
                language="javascript"
                style={github}
                customStyle={{
                  margin: 0,
                  padding: 0,
                  background: 'transparent',
                  fontSize: '0.75rem',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  },
                }}
              >
                {primarySnippet.code}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      )}
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
