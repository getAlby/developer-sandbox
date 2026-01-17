import { ExternalLink, Zap } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { scenarios } from '@/data/scenarios';
import { useScenarioStore } from '@/stores';

const externalLinks = [
  { title: 'Alby Hub', url: 'https://getalby.com/alby-hub', icon: '⚡' },
  { title: 'Alby SDK Docs', url: 'https://github.com/getalby/js-sdk', icon: '📚' },
];

export function AppSidebar() {
  const { currentScenario, setCurrentScenario } = useScenarioStore();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          <div>
            <h1 className="font-semibold">Alby Developer Sandbox</h1>
            <p className="text-xs text-muted-foreground">Learn & Build with NWC</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {scenarios.map((scenario) => (
                <SidebarMenuItem key={scenario.id}>
                  <SidebarMenuButton
                    isActive={currentScenario.id === scenario.id}
                    onClick={() => setCurrentScenario(scenario.id)}
                  >
                    <span>{scenario.icon}</span>
                    <span>{scenario.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

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
