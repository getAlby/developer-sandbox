import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { FloatingActivityPanel } from './floating-activity-panel';

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
      </SidebarInset>
      <FloatingActivityPanel />
    </SidebarProvider>
  );
}
