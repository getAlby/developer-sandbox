import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { FloatingActivityPanel } from "./floating-activity-panel";
import { AlbyHubIcon } from "@/icons/AlbyHubIcon";
import { AlbyIcon } from "@/icons/AlbyIcon";
import { BotIcon } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-2" />
          <span className="font-semibold">Alby Developer Sandbox</span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
        <footer className="shrink-0 border-t px-4 py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground/70 flex-wrap">
          <span className="inline-flex items-center gap-1">
            Built with
            <a
              href="https://github.com/getAlby/alby-agent-skill"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BotIcon className="size-3.5" />
              Alby Agent Skill
            </a>
          </span>
          <span className="opacity-40">·</span>
          <span className="inline-flex items-center gap-1">
            Powered by
            <a
              href="https://getalby.com/alby-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <AlbyHubIcon className="size-3.5" />
              Alby Hub
            </a>
          </span>
          <span className="opacity-40">·</span>
          <a
            href="https://getalby.com/subscription/new?coupon=SANDBOX"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            10% off first 3 months
            <AlbyIcon className="size-3.5 text-[#ffc800] dark:text-[#ffe480]" />
            Alby Cloud
          </a>
        </footer>
      </SidebarInset>
      <FloatingActivityPanel />
    </SidebarProvider>
  );
}
