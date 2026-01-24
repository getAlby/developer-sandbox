import {
  ExternalLink,
  TestTube,
  Wallet,
  Zap,
  Shield,
  Server,
  LightbulbIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlbyHubIcon } from "@/icons/AlbyHubIcon";
import { AlbyIcon } from "@/icons/AlbyIcon";

export function ProductionWallet() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Ready for Production?</h2>
        <p className="text-sm text-muted-foreground">
          The test wallets in this sandbox are great for learning and
          development, but they have important limitations. When you're ready to
          deploy your application to real users, you'll need a production
          Lightning wallet.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TestTube className="h-5 w-5 text-orange-500" />
              Test Wallets
            </CardTitle>
            <CardDescription>Used in this sandbox</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                <span>Isolated testing ecosystem - no real Bitcoin</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                <span>Cannot send/receive from external wallets</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                <span>Perfect for learning and prototyping</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                <span>
                  Created instantly via{" "}
                  <a
                    href="https://faucet.nwc.dev"
                    target="_blank"
                    className="underline"
                  >
                    NWC Faucet
                  </a>
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-yellow-500" />
              Production Wallets
            </CardTitle>
            <CardDescription>For real applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                <span>Real bitcoin on the lightning network</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                <span>Earn revenue from your users</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                <span>Routing fees based on payment route</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                <span>Your code works the same way!</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Recommended Production Wallets</h3>
        <p className="text-sm text-muted-foreground">
          These wallets support the Nostr Wallet Connect (NWC) protocol used in
          this sandbox.
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlbyHubIcon className="h-5 w-5 fill-current" />
              Alby Hub
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                Recommended
              </span>
            </CardTitle>
            <CardDescription>
              Self-custodial wallet with the most complete NWC implementation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-600">
                <Shield className="h-3 w-3" /> Self-custodial
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-600">
                <Server className="h-3 w-3" /> Multiple sub-wallets
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-1 text-xs text-purple-600">
                <Wallet className="h-3 w-3" /> Full NWC support
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-600">
                Free self-hosted
              </span>
            </div>
            <p className="text-muted-foreground">
              Run your own Lightning node with an easy-to-use interface. Perfect
              for developers who want full control over their funds and the most
              comprehensive NWC feature set.
            </p>
            <div className="flex items-center gap-2">
              <Button asChild variant="default" size="sm" className="gap-2">
                <a
                  href="https://getalby.com/alby-hub?ref=sandbox"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AlbyHubIcon className="size-3.5" />
                  Get Alby Hub
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a
                  href="https://getalby.com/subscription/new?coupon=SANDBOX"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AlbyIcon className="size-3.5 text-[#ffc800] dark:text-[#ffe480]" />
                  10% off first 3 months Alby Cloud
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rizful</CardTitle>
              <CardDescription>Free to start, custodial wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-xs text-orange-600">
                  Custodial
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-600">
                  Multiple vaults
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-600">
                  Free to start
                </span>
              </div>
              <p className="text-muted-foreground">
                Quick setup with NWC support. Supports isolated sub-wallets
                called "vaults".
              </p>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a
                  href="https://rizful.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Rizful
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">CoinOS</CardTitle>
              <CardDescription>Free to start, custodial wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-xs text-orange-600">
                  Custodial
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-600">
                  Free to start
                </span>
              </div>
              <p className="text-muted-foreground">
                Simple web-based wallet with NWC support. Easy onboarding for
                beginners.
              </p>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a
                  href="https://coinos.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit CoinOS
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-auto bg-muted/50">
        <CardContent className="">
          <p className="text-sm text-muted-foreground">
            <LightbulbIcon className="size-4 inline mr-1 mb-1" />
            The code you write using test wallets works exactly the same with
            production wallets. Just swap out the NWC connection string and
            you're ready to handle real payments!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
