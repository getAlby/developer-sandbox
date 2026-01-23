import { ExternalLink } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { scenarios } from "@/data/scenarios";
import { AlbyIcon } from "@/icons/AlbyIcon";
import { AlbyHubIcon } from "@/icons/AlbyHubIcon";

const externalLinks = [
  {
    title: "Alby Hub",
    url: "https://getalby.com/alby-hub",
    icon: <AlbyHubIcon className="size-4" />,
  },
  {
    title: "Alby Agent Skill",
    url: "https://github.com/getalby/alby-agent-skill",
    icon: "🤖",
  },
  {
    title: "NWC Faucet",
    url: "https://faucet.nwc.dev",
    icon: "💧",
  },
  {
    title: "Sandbox Source Code",
    url: "https://github.com/getAlby/developer-sandbox",
    icon: "💻",
  },
  {
    title: "Alby Developers",
    url: "https://getalby.com/developers",
    icon: "🔨",
  },
];

export function AppSidebar() {
  const location = useLocation();
  // Extract scenarioId from pathname (e.g., "/simple-payment" or "/#/simple-payment")
  const scenarioId = location.pathname.split("/").filter(Boolean)[0];

  return (
    <Sidebar>
      <SidebarHeader className="">
        <div className="flex items-center gap-2">
          <AlbyIcon className="size-6" />
          <div>
            <h1 className="font-semibold">Alby Developer Sandbox</h1>
            <p className="text-xs text-muted-foreground">
              Explore Lightning App Scenarios
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {scenarios.map((scenario) => (
                <SidebarMenuItem key={scenario.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={scenarioId === scenario.id}
                  >
                    <Link to={`/${scenario.id}`}>
                      <span>{scenario.icon}</span>
                      <span>{scenario.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-0" />

      <SidebarFooter>
        <SidebarMenu>
          {externalLinks.map((link) => (
            <SidebarMenuItem key={link.url}>
              <SidebarMenuButton asChild>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <span>{link.icon}</span>
                  <span>{link.title}</span>
                  <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
