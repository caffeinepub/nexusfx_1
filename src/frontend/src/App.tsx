import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Layout from "./components/Layout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { usePriceFeed } from "./hooks/usePriceFeed";
import Dashboard from "./pages/Dashboard";
import DepositPage from "./pages/DepositPage";
import History from "./pages/History";
import LoginPage from "./pages/LoginPage";
import Markets from "./pages/Markets";
import Positions from "./pages/Positions";
import WithdrawPage from "./pages/WithdrawPage";

export type PageId =
  | "dashboard"
  | "markets"
  | "positions"
  | "deposit"
  | "withdraw"
  | "history";

function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const prices = usePriceFeed(3000);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-mono">
            Initializing NexusFX...
          </p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard prices={prices} onNavigate={setCurrentPage} />;
      case "markets":
        return <Markets prices={prices} />;
      case "positions":
        return <Positions prices={prices} />;
      case "deposit":
        return <DepositPage />;
      case "withdraw":
        return <WithdrawPage />;
      case "history":
        return <History />;
      default:
        return <Dashboard prices={prices} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
