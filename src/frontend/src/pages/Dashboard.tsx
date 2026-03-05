import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import type { PageId } from "../App";
import type { Transaction } from "../backend.d";
import { TransactionType } from "../backend.d";
import type { PairPrice } from "../hooks/usePriceFeed";
import { formatPrice } from "../hooks/usePriceFeed";
import {
  useBalance,
  useOpenPositions,
  useTransactions,
} from "../hooks/useQueries";

interface DashboardProps {
  prices: Map<string, PairPrice>;
  onNavigate: (page: PageId) => void;
}

const DISPLAY_PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"];

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TransactionRow({ tx, index }: { tx: Transaction; index: number }) {
  const isDeposit = tx.transactionType === TransactionType.deposit;
  return (
    <div
      data-ocid={`history.item.${index + 1}`}
      className="flex items-center justify-between py-3 border-b border-border/40 last:border-0"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDeposit ? "bg-profit-muted" : "bg-loss-muted"
          }`}
        >
          {isDeposit ? (
            <ArrowDownToLine className="w-3.5 h-3.5 text-profit" />
          ) : (
            <ArrowUpFromLine className="w-3.5 h-3.5 text-loss" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium capitalize">{tx.transactionType}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {formatTimestamp(tx.timestamp)}
          </p>
        </div>
      </div>
      <span
        className={`font-mono font-semibold text-sm ${
          isDeposit ? "text-profit" : "text-loss"
        }`}
      >
        {isDeposit ? "+" : "-"}$
        {tx.amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>
  );
}

export default function Dashboard({ prices, onNavigate }: DashboardProps) {
  const { data: balance, isLoading: balanceLoading } = useBalance();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: positions } = useOpenPositions();

  const openPnl = (positions ?? []).reduce((sum, pos) => {
    const current = prices.get(pos.pair);
    if (!current) return sum;
    const priceDiff =
      pos.side === "buy"
        ? current.mid - pos.entryPrice
        : pos.entryPrice - current.mid;
    const pnl = priceDiff * pos.lotSize * 100_000;
    return sum + pnl;
  }, 0);

  const equity = (balance ?? 0) + openPnl;
  const recentTx = (transactions ?? []).slice(-5).reverse();

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of your trading account
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Balance Card */}
        <motion.div
          data-ocid="dashboard.balance.card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="sm:col-span-1 card-glass rounded-xl p-5 glow-neon"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Account Balance
            </p>
            <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-neon" />
            </div>
          </div>
          {balanceLoading ? (
            <Skeleton className="h-9 w-36" />
          ) : (
            <p className="font-display text-3xl font-bold text-neon">
              $
              {(balance ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Available funds</p>
        </motion.div>

        {/* Equity Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="card-glass rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Equity
            </p>
            <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
          {balanceLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <p className="font-display text-3xl font-bold text-foreground">
              $
              {equity.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Balance + open P&L
          </p>
        </motion.div>

        {/* Open P&L Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          className="card-glass rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              Open P&L
            </p>
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center ${
                openPnl >= 0 ? "bg-profit-muted" : "bg-loss-muted"
              }`}
            >
              {openPnl >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-profit" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-loss" />
              )}
            </div>
          </div>
          <p
            className={`font-display text-3xl font-bold ${
              openPnl >= 0 ? "text-profit" : "text-loss"
            }`}
          >
            {openPnl >= 0 ? "+" : ""}$
            {Math.abs(openPnl).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {(positions ?? []).length} open position
            {(positions ?? []).length !== 1 ? "s" : ""}
          </p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.22 }}
        className="flex gap-3"
      >
        <Button
          data-ocid="dashboard.deposit.button"
          onClick={() => onNavigate("deposit")}
          className="flex-1 sm:flex-none sm:w-40 gap-2 font-semibold"
          style={{
            background: "oklch(0.78 0.18 195)",
            color: "oklch(0.08 0.02 250)",
          }}
        >
          <ArrowDownToLine className="w-4 h-4" />
          Deposit
        </Button>
        <Button
          data-ocid="dashboard.withdraw.button"
          onClick={() => onNavigate("withdraw")}
          variant="outline"
          className="flex-1 sm:flex-none sm:w-40 gap-2 font-semibold border-border/60 hover:border-primary/40"
        >
          <ArrowUpFromLine className="w-4 h-4" />
          Withdraw
        </Button>
      </motion.div>

      {/* Bottom Row: Market Overview + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mini Market Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28 }}
          className="card-glass rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm">
              Market Overview
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("markets")}
              className="text-xs text-neon hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {DISPLAY_PAIRS.map((pair) => {
              const p = prices.get(pair);
              if (!p) return null;
              const isUp = p.direction === "up";
              return (
                <div
                  key={pair}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                      <span className="text-[9px] font-bold font-mono text-muted-foreground">
                        {pair.replace("/", "")}
                      </span>
                    </div>
                    <span className="font-medium text-sm">{pair}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold">
                      {formatPrice(pair, p.mid)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs font-mono px-1.5 py-0.5 border-0 ${
                        isUp
                          ? "bg-profit-muted text-profit"
                          : "bg-loss-muted text-loss"
                      }`}
                    >
                      {isUp ? "▲" : "▼"} {Math.abs(p.changePercent).toFixed(3)}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.34 }}
          className="card-glass rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-sm">
              Recent Transactions
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("history")}
              className="text-xs text-neon hover:underline"
            >
              View all →
            </button>
          </div>
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentTx.length === 0 ? (
            <div
              data-ocid="history.empty_state"
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <Activity className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                No transactions yet
              </p>
              <button
                type="button"
                onClick={() => onNavigate("deposit")}
                className="text-xs text-neon hover:underline mt-1"
              >
                Make your first deposit
              </button>
            </div>
          ) : (
            <div>
              {recentTx.map((tx, i) => (
                <TransactionRow key={String(tx.id)} tx={tx} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
