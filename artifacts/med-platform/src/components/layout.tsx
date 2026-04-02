import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, UsersRound, LogOut, Menu, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { UserRole } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
      },
    });
  };

  const hasUsersAccess = user?.role === UserRole.super_admin || user?.role === UserRole.admin;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/patients", label: "Bemorlar", icon: UsersRound },
    ...(hasUsersAccess ? [{ href: "/users", label: "Foydalanuvchilar", icon: Users }] : []),
    { href: "/settings", label: "Sozlamalar", icon: SettingsIcon },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      <div className="p-6 flex flex-col items-center">
        <div className="w-40 h-40 mb-2">
          <img src="/logo_fanamed.jpeg" alt="FANA MED Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-sidebar-primary uppercase text-center">FANA MED KO'RIK</h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium tracking-widest text-center">PLATFORMASI</p>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" 
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="mb-4 px-3 flex flex-col">
          <span className="text-sm font-medium">{user?.name}</span>
          <span className="text-xs text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</span>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Chiqish
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="fixed inset-y-0 w-64">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-lg font-bold text-primary uppercase">FANA MED KO'RIK</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
