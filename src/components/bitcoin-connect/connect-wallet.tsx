import { useState, useEffect, useRef } from "react";
import {
  launchModal,
  onConnected,
  onDisconnected,
  onModalOpened,
  onModalClosed,
  disconnect,
} from "@getalby/bitcoin-connect-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTransactionStore } from "@/stores";
import {
  Loader2,
  Unplug,
  Wallet,
  Zap,
  TestTube2,
  Copy,
  Check,
} from "lucide-react";
import { createTestWallet } from "@/lib/faucet";

interface WalletInfo {
  alias?: string;
  balance?: number;
}

export function ConnectWalletScenario() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [testConnectionString, setTestConnectionString] = useState<
    string | null
  >(null);
  const [isCreatingTestWallet, setIsCreatingTestWallet] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalOpenedTxIdRef = useRef<string | null>(null);
  const { addTransaction, updateTransaction } = useTransactionStore();

  useEffect(() => {
    // Subscribe to connection events
    const unsubConnected = onConnected(async (provider) => {
      setIsConnected(true);
      setIsLoading(true);

      addTransaction({
        type: "balance_updated",
        status: "success",
        description: "Wallet connected via Bitcoin Connect",
        snippetIds: ["bc-launch-modal"],
      });

      try {
        // Get wallet info
        const info = await provider.getInfo();
        const balance = await provider.getBalance();

        const walletData: WalletInfo = {
          alias: info.node?.alias || "Connected Wallet",
          // WebLN returns balance in sats
          balance:
            typeof balance.balance === "number"
              ? Math.floor(balance.balance)
              : undefined,
        };

        setWalletInfo(walletData);

        addTransaction({
          type: "balance_updated",
          status: "success",
          description: `Connected to ${walletData.alias}${walletData.balance !== undefined ? ` with ${walletData.balance.toLocaleString()} sats` : ""}`,
          amount: walletData.balance,
          snippetIds: ["bc-launch-modal"],
        });
      } catch (error) {
        console.error("Failed to get wallet info:", error);
        setWalletInfo({ alias: "Connected Wallet" });
      } finally {
        setIsLoading(false);
      }
    });

    const unsubDisconnected = onDisconnected(() => {
      setIsConnected(false);
      setWalletInfo(null);

      addTransaction({
        type: "balance_updated",
        status: "success",
        description: "Wallet disconnected",
        snippetIds: ["bc-disconnect"],
      });
    });

    const unsubModalOpened = onModalOpened(() => {
      const txId = addTransaction({
        type: "balance_updated",
        status: "pending",
        description: "Bitcoin Connect modal opened",
        snippetIds: ["bc-launch-modal"],
      });
      modalOpenedTxIdRef.current = txId;
    });

    const unsubModalClosed = onModalClosed(() => {
      if (modalOpenedTxIdRef.current) {
        updateTransaction(modalOpenedTxIdRef.current, {
          status: "success",
          description: "Bitcoin Connect modal closed",
        });
        modalOpenedTxIdRef.current = null;
      }
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubModalOpened();
      unsubModalClosed();
    };
  }, [addTransaction, updateTransaction]);

  const handleConnect = () => {
    launchModal();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleGetTestConnectionString = async () => {
    setIsCreatingTestWallet(true);
    try {
      const connectionSecret = await createTestWallet();
      setTestConnectionString(connectionSecret);
    } catch (error) {
      console.error("Failed to create test wallet:", error);
    } finally {
      setIsCreatingTestWallet(false);
    }
  };

  const handleCopyConnectionString = async () => {
    if (testConnectionString) {
      await navigator.clipboard.writeText(testConnectionString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex gap-2 max-md:flex-wrap">
      <Card>
        <CardHeader className="pb-2 min-w-xs">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Bitcoin Connect Wallet</span>
            </CardTitle>
            <Badge
              variant={isConnected ? "default" : "outline"}
              className={isConnected ? "bg-green-500" : ""}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardHeader>
        <div className="flex-1" />

        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading wallet info...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Wallet className="h-4 w-4" />
                    <span>{walletInfo?.alias || "Connected Wallet"}</span>
                  </div>
                  {walletInfo?.balance !== undefined && (
                    <div className="text-2xl font-bold">
                      {walletInfo.balance.toLocaleString()} sats
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="w-full"
              >
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Click the button below to open the Bitcoin Connect modal and
                connect your Lightning wallet. Bitcoin Connect supports various
                wallet types including NWC, browser extensions, and mobile apps.
              </p>

              <Button onClick={handleConnect} className="w-full">
                <Zap className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {!isConnected && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TestTube2 className="h-5 w-5 text-purple-500" />
              <span>Try with a Test Wallet</span>
            </CardTitle>
          </CardHeader>
          <div className="flex-1" />
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Don't have a Lightning wallet? You can use a free test wallet to
              try this demo. Click the button below to get a connection string,
              then use the <strong>"NWC"</strong> option in the connect modal
              and paste it there.
            </p>

            {testConnectionString ? (
              <div className="space-y-3">
                <div className="relative">
                  <code className="block p-3 pr-12 bg-muted rounded-md text-xs break-all max-h-24 overflow-y-auto">
                    {testConnectionString}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={handleCopyConnectionString}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Copy this connection string, click "Connect Wallet" above,
                  select "NWC", and paste it in the input field.
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleGetTestConnectionString}
                disabled={isCreatingTestWallet}
                className="w-full"
              >
                {isCreatingTestWallet ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating test wallet...
                  </>
                ) : (
                  <>
                    <TestTube2 className="mr-2 h-4 w-4" />
                    Get NWC Test Connection String
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
