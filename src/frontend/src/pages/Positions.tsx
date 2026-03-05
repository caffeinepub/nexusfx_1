import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { ClosedTrade, Position } from "../backend.d";
import type { PairPrice } from "../hooks/usePriceFeed";
import { formatPrice } from "../hooks/usePriceFeed";
import {
  useCloseTrade,
  useClosedTrades,
  useOpenPositions,
} from "../hooks/useQueries";

interface PositionsProps {
  prices: Map<string, PairPrice>;
}

function calcPnl(pos: Position, currentMid: number): number {
  const priceDiff =
    pos.side === "buy"
      ? currentMid - pos.entryPrice
      : pos.entryPrice - currentMid;
  return priceDiff * pos.lotSize * 100_000;
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Positions({ prices }: PositionsProps) {
  const { data: openPositions, isLoading: loadingOpen } = useOpenPositions();
  const { data: closedTrades, isLoading: loadingClosed } = useClosedTrades();
  const closeTrade = useCloseTrade();

  const [closeDialog, setCloseDialog] = useState<{
    open: boolean;
    position: Position | null;
  }>({ open: false, position: null });

  const handleClosePosition = async () => {
    if (!closeDialog.position) return;
    const pos = closeDialog.position;
    const currentPrice = prices.get(pos.pair);
    const closePrice = currentPrice
      ? pos.side === "buy"
        ? currentPrice.bid
        : currentPrice.ask
      : pos.entryPrice;

    try {
      await closeTrade.mutateAsync({
        tradeId: pos.id,
        closePrice,
      });
      toast.success(`Position ${pos.pair} closed`);
      setCloseDialog({ open: false, position: null });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to close position");
    }
  };

  const totalOpenPnl = (openPositions ?? []).reduce((sum, pos) => {
    const p = prices.get(pos.pair);
    return sum + (p ? calcPnl(pos, p.mid) : 0);
  }, 0);

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Positions
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your open and closed trades
        </p>
      </div>

      {/* Summary bar */}
      {(openPositions ?? []).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-glass rounded-xl p-4 mb-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-muted-foreground">
              {(openPositions ?? []).length} Open Position
              {(openPositions ?? []).length !== 1 ? "s" : ""}
            </p>
            <p
              className={`font-display text-xl font-bold ${totalOpenPnl >= 0 ? "text-profit" : "text-loss"}`}
            >
              {totalOpenPnl >= 0 ? "+" : ""}$
              {Math.abs(totalOpenPnl).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <Badge
            className={`text-sm font-mono px-3 py-1 ${
              totalOpenPnl >= 0
                ? "bg-profit-muted text-profit border-profit/20"
                : "bg-loss-muted text-loss border-loss/20"
            }`}
            variant="outline"
          >
            Floating P&L
          </Badge>
        </motion.div>
      )}

      <Tabs defaultValue="open">
        <TabsList className="bg-secondary/50 mb-5 w-full sm:w-auto">
          <TabsTrigger
            value="open"
            data-ocid="positions.open.table"
            className="flex-1 sm:flex-none data-[state=active]:bg-card data-[state=active]:text-neon"
          >
            Open ({(openPositions ?? []).length})
          </TabsTrigger>
          <TabsTrigger
            value="closed"
            data-ocid="positions.closed.table"
            className="flex-1 sm:flex-none data-[state=active]:bg-card data-[state=active]:text-neon"
          >
            Closed ({(closedTrades ?? []).length})
          </TabsTrigger>
        </TabsList>

        {/* Open Positions */}
        <TabsContent value="open">
          {loadingOpen ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (openPositions ?? []).length === 0 ? (
            <div className="card-glass rounded-xl p-12 text-center">
              <X className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No open positions</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Go to Markets to place a trade
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {openPositions!.map((pos, index) => {
                const p = prices.get(pos.pair);
                const pnl = p ? calcPnl(pos, p.mid) : 0;
                const isProfit = pnl >= 0;
                const currentPrice = p
                  ? pos.side === "buy"
                    ? p.bid
                    : p.ask
                  : pos.entryPrice;

                return (
                  <motion.div
                    key={String(pos.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="card-glass rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Pair & Side */}
                        <div>
                          <p className="font-display font-bold text-sm">
                            {pos.pair}
                          </p>
                          <Badge
                            className={`text-xs mt-1 font-mono px-2 border-0 ${
                              pos.side === "buy"
                                ? "bg-profit-muted text-profit"
                                : "bg-loss-muted text-loss"
                            }`}
                          >
                            {pos.side.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Entry / Current */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Entry → Current
                          </p>
                          <p className="font-mono text-sm">
                            {formatPrice(pos.pair, pos.entryPrice)}
                          </p>
                          <p className="font-mono text-sm font-semibold text-neon">
                            {p ? formatPrice(pos.pair, currentPrice) : "—"}
                          </p>
                        </div>

                        {/* Lot size */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Lot Size
                          </p>
                          <p className="font-mono text-sm font-semibold">
                            {pos.lotSize}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(pos.openTimestamp)}
                          </p>
                        </div>

                        {/* P&L */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Float P&L
                          </p>
                          <p
                            className={`font-mono text-sm font-bold ${
                              isProfit ? "text-profit" : "text-loss"
                            }`}
                          >
                            {isProfit ? "+" : ""}$
                            {Math.abs(pnl).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>

                      <Button
                        data-ocid={`positions.close.button.${index + 1}`}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCloseDialog({ open: true, position: pos })
                        }
                        className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        Close
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Closed Trades */}
        <TabsContent value="closed">
          {loadingClosed ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (closedTrades ?? []).length === 0 ? (
            <div className="card-glass rounded-xl p-12 text-center">
              <X className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No closed trades yet
              </p>
            </div>
          ) : (
            <div className="card-glass rounded-xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_80px_80px_90px] gap-2 px-4 py-2 border-b border-border/50 text-xs font-mono text-muted-foreground uppercase tracking-wider">
                <span>Pair / Side</span>
                <span className="text-right">Entry</span>
                <span className="text-right">Close</span>
                <span className="text-right">Lots</span>
                <span className="text-right">P&L</span>
              </div>
              {closedTrades!.map((trade: ClosedTrade) => {
                const isProfit = trade.pnl >= 0;
                return (
                  <div
                    key={String(trade.id)}
                    className="grid grid-cols-[1fr_80px_80px_80px_90px] gap-2 items-center px-4 py-3 border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors"
                  >
                    <div>
                      <p className="font-display font-semibold text-sm">
                        {trade.pair}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          className={`text-xs px-1.5 py-0 border-0 ${
                            trade.side === "buy"
                              ? "bg-profit-muted text-profit"
                              : "bg-loss-muted text-loss"
                          }`}
                        >
                          {trade.side.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatTimestamp(trade.closeTimestamp)}
                        </span>
                      </div>
                    </div>
                    <span className="text-right font-mono text-xs">
                      {formatPrice(trade.pair, trade.entryPrice)}
                    </span>
                    <span className="text-right font-mono text-xs">
                      {formatPrice(trade.pair, trade.closePrice)}
                    </span>
                    <span className="text-right font-mono text-sm">
                      {trade.lotSize}
                    </span>
                    <span
                      className={`text-right font-mono font-bold text-sm ${
                        isProfit ? "text-profit" : "text-loss"
                      }`}
                    >
                      {isProfit ? "+" : ""}$
                      {Math.abs(trade.pnl).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Close Confirm Dialog */}
      <Dialog
        open={closeDialog.open}
        onOpenChange={(o) =>
          !closeTrade.isPending && setCloseDialog((d) => ({ ...d, open: o }))
        }
      >
        <DialogContent className="bg-popover border-border/60 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Close Position
            </DialogTitle>
            <DialogDescription>
              {closeDialog.position && (
                <span>
                  Close{" "}
                  <strong className="text-foreground">
                    {closeDialog.position.side.toUpperCase()}{" "}
                    {closeDialog.position.pair}
                  </strong>{" "}
                  at current market price?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {closeDialog.position && (
            <div className="bg-secondary/50 rounded-lg p-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Pair</p>
                <p className="font-semibold font-mono">
                  {closeDialog.position.pair}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lots</p>
                <p className="font-semibold font-mono">
                  {closeDialog.position.lotSize}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Entry</p>
                <p className="font-semibold font-mono">
                  {formatPrice(
                    closeDialog.position.pair,
                    closeDialog.position.entryPrice,
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Est. Close</p>
                <p className="font-semibold font-mono text-neon">
                  {(() => {
                    const p = prices.get(closeDialog.position.pair);
                    return p
                      ? formatPrice(
                          closeDialog.position.pair,
                          closeDialog.position.side === "buy" ? p.bid : p.ask,
                        )
                      : "—";
                  })()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              data-ocid="positions.cancel.button"
              variant="outline"
              onClick={() => setCloseDialog({ open: false, position: null })}
              disabled={closeTrade.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-ocid="positions.confirm.button"
              onClick={handleClosePosition}
              disabled={closeTrade.isPending}
              variant="destructive"
              className="flex-1"
            >
              {closeTrade.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Close Position"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
