import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownToLine, ArrowUpFromLine, Receipt } from "lucide-react";
import { motion } from "motion/react";
import { TransactionType } from "../backend.d";
import { useTransactions } from "../hooks/useQueries";

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History() {
  const { data: transactions, isLoading } = useTransactions();

  // Sort newest first
  const sorted = [...(transactions ?? [])].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Transaction History
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete record of all deposits and withdrawals
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          data-ocid="history.empty_state"
          className="card-glass rounded-xl p-16 text-center"
        >
          <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Your deposit and withdrawal history will appear here
          </p>
        </div>
      ) : (
        <motion.div
          data-ocid="history.table"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-glass rounded-xl overflow-hidden"
        >
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_160px_120px_100px] gap-3 px-5 py-3 border-b border-border/50 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <span>Type</span>
            <span>Date & Time</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Status</span>
          </div>

          {/* Rows */}
          {sorted.map((tx, index) => {
            const isDeposit = tx.transactionType === TransactionType.deposit;

            return (
              <motion.div
                key={String(tx.id)}
                data-ocid={`history.item.${index + 1}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex sm:grid sm:grid-cols-[1fr_160px_120px_100px] gap-3 items-center px-5 py-4 border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors"
              >
                {/* Type */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${
                      isDeposit ? "bg-profit-muted" : "bg-loss-muted"
                    }`}
                  >
                    {isDeposit ? (
                      <ArrowDownToLine className="w-4 h-4 text-profit" />
                    ) : (
                      <ArrowUpFromLine className="w-4 h-4 text-loss" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm capitalize">
                      {tx.transactionType}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono sm:hidden">
                      {formatTimestamp(tx.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <span className="hidden sm:block font-mono text-sm text-muted-foreground">
                  {formatTimestamp(tx.timestamp)}
                </span>

                {/* Amount */}
                <span
                  className={`ml-auto sm:ml-0 text-right font-mono font-bold text-sm ${
                    isDeposit ? "text-profit" : "text-loss"
                  }`}
                >
                  {isDeposit ? "+" : "-"}$
                  {tx.amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>

                {/* Status */}
                <div className="hidden sm:flex justify-end">
                  <Badge
                    className="text-xs font-mono px-2 border-0 bg-profit-muted text-profit"
                    variant="outline"
                  >
                    Completed
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Summary */}
      {sorted.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card-glass rounded-xl p-4 mt-4 grid grid-cols-3 gap-4"
        >
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Deposits</p>
            <p className="font-display font-bold text-profit">
              $
              {sorted
                .filter((t) => t.transactionType === TransactionType.deposit)
                .reduce((s, t) => s + t.amount, 0)
                .toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </div>
          <div className="text-center border-x border-border/30">
            <p className="text-xs text-muted-foreground">Total Withdrawals</p>
            <p className="font-display font-bold text-loss">
              $
              {sorted
                .filter((t) => t.transactionType === TransactionType.withdraw)
                .reduce((s, t) => s + t.amount, 0)
                .toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="font-display font-bold text-foreground">
              {sorted.length}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
