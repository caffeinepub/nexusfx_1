import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Briefcase,
  ChevronRight,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { PageId } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useBalance } from "../hooks/useQueries";

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  ocid: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    id: "markets",
    label: "Markets",
    icon: TrendingUp,
    ocid: "nav.markets.link",
  },
  {
    id: "positions",
    label: "Positions",
    icon: Briefcase,
    ocid: "nav.positions.link",
  },
  {
    id: "deposit",
    label: "Deposit",
    icon: ArrowDownToLine,
    ocid: "nav.deposit.link",
  },
  {
    id: "withdraw",
    label: "Withdraw",
    icon: ArrowUpFromLine,
    ocid: "nav.withdraw.link",
  },
  {
    id: "history",
    label: "History",
    icon: History,
    ocid: "nav.history.link",
  },
];

interface LayoutProps {
  children: ReactNode;
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export default function Layout({
  children,
  currentPage,
  onNavigate,
}: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: balance } = useBalance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-4)}`
    : "Anonymous";
  const initials = shortPrincipal.slice(0, 2).toUpperCase();

  const handleNavigate = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border fixed h-full z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center glow-neon">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-neon tracking-tight">
              NexusFX
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={item.ocid}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 group relative ${
                  isActive
                    ? "bg-primary/10 text-neon border border-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-primary/10 rounded-md border border-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <Icon
                  className={`w-4 h-4 relative z-10 ${isActive ? "text-neon" : ""}`}
                />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto relative z-10 text-neon" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Balance & User Info */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="bg-sidebar-accent rounded-md p-3">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
              Account Balance
            </p>
            <p className="font-display text-lg font-bold text-neon font-mono">
              $
              {(balance ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-neon text-xs font-mono">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-muted-foreground truncate">
                {shortPrincipal}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clear}
              className="w-7 h-7 text-muted-foreground hover:text-destructive"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-20 flex items-center px-4 lg:px-6 gap-4">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-neon">
              NexusFX
            </span>
          </div>

          <div className="flex-1" />

          {/* Balance chip */}
          <div className="hidden sm:flex items-center gap-2 bg-card border border-border rounded-md px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse-neon" />
            <span className="text-xs text-muted-foreground font-mono">
              Balance:
            </span>
            <span className="text-sm font-bold text-neon font-mono">
              $
              {(balance ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-neon text-xs font-mono">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="hidden sm:flex text-muted-foreground hover:text-destructive text-xs gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-3 px-6 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Built with ♥ using caffeine.ai
            </a>
          </p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-20 flex">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={item.ocid}
              onClick={() => handleNavigate(item.id)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                isActive
                  ? "text-neon"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-neon" : ""}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 lg:hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <span className="font-display font-bold text-lg text-neon">
                    NexusFX
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      data-ocid={item.ocid}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary/10 text-neon"
                          : "text-sidebar-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-sidebar-border">
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/20 text-neon text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {shortPrincipal}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={clear}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
