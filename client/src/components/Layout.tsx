import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  AlertTriangle, 
  FileText, 
  Settings, 
  Menu, 
  LogOut,
  UserCircle
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/audits", label: "Audits", icon: ClipboardCheck },
    { href: "/actions", label: "Corrective Actions", icon: AlertTriangle },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-50 p-4">
      <div className="flex items-center gap-3 px-2 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
          <ClipboardCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl tracking-tight">OHSA Audit</h1>
          <p className="text-xs text-slate-400">Compliance Pro</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (location !== "/" && location.startsWith(item.href) && item.href !== "/");
          return (
            <Link key={item.href} href={item.href} className="block" onClick={() => setIsOpen(false)}>
              <div 
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/25 font-medium" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-current"}`} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-800 my-4" />

      <div className="mt-auto">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 mb-3">
          <div className="bg-slate-700 p-2 rounded-full">
            <UserCircle className="w-5 h-5 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || user?.username}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role || "Auditor"}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-950/20"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-slate-900">OHSA Audit</span>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6 text-slate-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 border-r-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
