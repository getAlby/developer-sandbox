import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  useTransactionStore,
  useWalletStore,
  useScenarioStore,
} from "@/stores";
import { WALLET_PERSONAS } from "@/types/wallet";

interface WalletPosition {
  id: string;
  emoji: string;
  row: number;
  col: number;
}

interface AnimationState {
  id: string;
  fromIndex: number;
  toIndex: number;
  type: "request" | "payment";
}

const FADE_TIMEOUT = 5000; // 5 seconds after last transaction

export function FloatingActivityPanel() {
  const wallets = useWalletStore((state) => state.wallets);
  const currentScenario = useScenarioStore((state) => state.currentScenario);

  const [isVisible, setIsVisible] = useState(false);
  const [animations, setAnimations] = useState<AnimationState[]>([]);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationCounterRef = useRef(0);

  // Build wallet positions in 2x2 grid
  const walletPositions: WalletPosition[] = useMemo(() => {
    const requiredWalletIds = currentScenario?.requiredWallets || [
      "alice",
      "bob",
    ];
    return requiredWalletIds.slice(0, 4).map((id: string, index: number) => ({
      id,
      emoji: WALLET_PERSONAS[id]?.emoji || "👤",
      row: Math.floor(index / 2),
      col: index % 2,
    }));
  }, [currentScenario?.requiredWallets]);

  const getWalletIndex = useCallback(
    (walletId: string) => {
      return walletPositions.findIndex((w) => w.id === walletId);
    },
    [walletPositions],
  );

  // Show panel and create animations when transactions change
  const showPanel = useCallback(() => {
    setIsVisible(true);

    // Clear existing timeout
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    // Set new fade timeout
    fadeTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, FADE_TIMEOUT);
  }, []);

  const createAnimation = useCallback(
    (fromWallet: string, toWallet: string, isPayment: boolean) => {
      const fromIndex = getWalletIndex(fromWallet);
      const toIndex = getWalletIndex(toWallet);

      if (fromIndex !== -1 && toIndex !== -1) {
        const animId = `anim-${++animationCounterRef.current}`;

        setAnimations((prev) => [
          ...prev.slice(-5), // Keep only last 5 animations
          {
            id: animId,
            fromIndex,
            toIndex,
            type: isPayment ? "payment" : "request",
          },
        ]);

        // Remove animation after it completes
        // Payment animations are 0.8s, request animations are 1.5s (round trip)
        const duration = isPayment ? 1000 : 1800;
        setTimeout(() => {
          setAnimations((prev) => prev.filter((a) => a.id !== animId));
        }, duration);
      }
    },
    [getWalletIndex],
  );

  // Subscribe to transaction store changes
  useEffect(() => {
    // Use zustand's subscribe to react to changes outside of render
    const unsubscribe = useTransactionStore.subscribe((state, prevState) => {
      const currentCount = state.transactions.length;
      const prevCount = prevState.transactions.length;

      if (currentCount > prevCount) {
        // Create animation for the latest transaction
        for (
          let i = prevState.transactions.length;
          i < state.transactions.length;
          i++
        ) {
          const latestTx = state.transactions[i];
          if (
            latestTx.fromWallet &&
            latestTx.toWallet &&
            latestTx.fromWallet !== latestTx.toWallet
          ) {
            // New displayable transaction added - show panel
            showPanel();
            const isPayment = [
              "payment_sent",
              "payment_received",
              "invoice_paid",
            ].includes(latestTx.type);
            createAnimation(latestTx.fromWallet, latestTx.toWallet, isPayment);
          }
        }
      }
    });

    return unsubscribe;
  }, [showPanel, createAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  // Calculate animation path between two wallet positions
  const getAnimationPath = useCallback(
    (fromIndex: number, toIndex: number) => {
      const from = walletPositions[fromIndex];
      const to = walletPositions[toIndex];
      if (!from || !to) return null;

      // Grid cell is 48px, with 8px gap, emoji is centered
      const cellSize = 48;
      const gap = 8;
      const offset = cellSize / 2;

      const fromX = from.col * (cellSize + gap) + offset;
      const fromY = from.row * (cellSize + gap) + offset;
      const toX = to.col * (cellSize + gap) + offset;
      const toY = to.row * (cellSize + gap) + offset;

      return { fromX, fromY, toX, toY };
    },
    [walletPositions],
  );

  // Don't render if no wallets or not visible
  if (!isVisible || walletPositions.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 pointer-events-none transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="relative bg-background/80 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg">
        {/* 2x2 Wallet Grid */}
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(walletPositions.length, 2)}, 48px)`,
            gridTemplateRows: `repeat(${Math.ceil(walletPositions.length / 2)}, 48px)`,
          }}
        >
          {walletPositions.map((wallet) => {
            const walletData = wallets[wallet.id];
            const isConnected = walletData?.status === "connected";

            return (
              <div
                key={wallet.id}
                className={`relative flex items-center justify-center w-12 h-12 rounded-lg bg-muted/50 transition-all duration-300 ${
                  isConnected ? "ring-2 ring-green-500/30" : ""
                }`}
              >
                <span className="text-2xl select-none">{wallet.emoji}</span>
                {/* Connection indicator */}
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                    isConnected ? "bg-green-500" : "bg-muted-foreground/30"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Animation SVG overlay */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            {/* Request animation gradient */}
            <linearGradient
              id="requestGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="var(--color-muted-foreground)"
                stopOpacity="0"
              />
              <stop
                offset="50%"
                stopColor="var(--color-muted-foreground)"
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor="var(--color-muted-foreground)"
                stopOpacity="0"
              />
            </linearGradient>

            {/* Payment animation gradient (yellow/gold for lightning) */}
            <linearGradient
              id="paymentGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {animations.map((anim) => {
            const path = getAnimationPath(anim.fromIndex, anim.toIndex);
            if (!path) return null;

            // Add padding offset for the container padding (12px = p-3)
            const padding = 12;
            const { fromX, fromY, toX, toY } = path;

            return (
              <g key={anim.id}>
                {anim.type === "payment" ? (
                  // Lightning bolt animation
                  <>
                    <line
                      x1={fromX + padding}
                      y1={fromY + padding}
                      x2={toX + padding}
                      y2={toY + padding}
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="animate-lightning-strike"
                      style={{
                        filter: "drop-shadow(0 0 6px #f59e0b)",
                      }}
                    />
                    {/* Lightning bolt emoji that travels along the path */}
                    <text
                      className="animate-travel-bolt"
                      style={{
                        fontSize: "16px",
                        ["--from-x" as string]: `${fromX + padding}px`,
                        ["--from-y" as string]: `${fromY + padding}px`,
                        ["--to-x" as string]: `${toX + padding}px`,
                        ["--to-y" as string]: `${toY + padding}px`,
                      }}
                    >
                      ⚡
                    </text>
                  </>
                ) : (
                  // Network request animation (dotted line)
                  <>
                    <line
                      x1={fromX + padding}
                      y1={fromY + padding}
                      x2={toX + padding}
                      y2={toY + padding}
                      stroke="url(#requestGradient)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-dash-travel"
                    />
                    {/* Small dot that travels */}
                    <circle
                      r="4"
                      fill="var(--color-muted-foreground)"
                      className="animate-travel-dot"
                      style={{
                        ["--from-x" as string]: `${fromX + padding}px`,
                        ["--from-y" as string]: `${fromY + padding}px`,
                        ["--to-x" as string]: `${toX + padding}px`,
                        ["--to-y" as string]: `${toY + padding}px`,
                      }}
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
