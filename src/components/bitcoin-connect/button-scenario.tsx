import { useState, useEffect } from "react";
import {
  Button as BitcoinConnectButton,
  onConnected,
  onDisconnected,
} from "@getalby/bitcoin-connect-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, TestTube2, Loader2, Copy, Check } from "lucide-react";
import { createTestWallet } from "@/lib/faucet";

export function BitcoinConnectButtonScenario() {
  const [isConnected, setIsConnected] = useState(false);
  const [testConnectionString, setTestConnectionString] = useState<
    string | null
  >(null);
  const [isCreatingTestWallet, setIsCreatingTestWallet] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubConnected = onConnected(() => {
      setIsConnected(true);
    });

    const unsubDisconnected = onDisconnected(() => {
      setIsConnected(false);
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
    };
  }, []);

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
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Bitcoin Connect Button</span>
          </CardTitle>
        </CardHeader>
        <div className="flex-1" />
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The simplest way to add Lightning wallet connectivity. Just drop in
            the Button component - it handles connection, displays balance, and
            manages wallet state automatically.
          </p>
          <div className="flex justify-center">
            <BitcoinConnectButton />
          </div>
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
                  Copy this connection string, click the button above, select
                  "NWC", and paste it in the input field.
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
