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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { TradeSide } from "../backend.d";
import type { PairPrice } from "../hooks/usePriceFeed";
import { FOREX_PAIRS, formatPrice } from "../hooks/usePriceFeed";
import { usePlaceTrade } from "../hooks/useQueries";

interface MarketsProps {
  prices: Map<string, PairPrice>;
}

interface TradeDialogState {
  open: boolean;
  pair: string;
  side: TradeSide;
  price: number;
}

const LOT_SIZE_USD = 100_000;

export default function Markets({ prices }: MarketsProps) {
  const [tradeDialog, setTradeDialog] = useState<TradeDialogState>({
    open: false,
    pair: "",
    side: TradeSide.buy,
    price: 0,
  });
  const [lotSize, setLotSize] = useState("0.1");
  const placeTrade = usePlaceTrade();

  const openTrade = (pair: string, side: TradeSide, price: number) => {
    setLotSize("0.1");
    setTradeDialog({ open: true, pair, side, price });
  };

  const handleConfirm = async () => {
    const size = Number.parseFloat(lotSize);
    if (Number.isNaN(size) || size <= 0) {
      toast.error("Invalid lot size");
      return;
    }
    const currentPrice = prices.get(tradeDialog.pair);
    const execPrice = currentPrice
      ? tradeDialog.side === TradeSide.buy
        ? currentPrice.ask
        : currentPrice.bid
      : tradeDialog.price;

    try {
      await placeTrade.mutateAsync({
        pair: tradeDialog.pair,
        side: tradeDialog.side,
        lotSize: size,
        entryPrice: execPrice,
      });
      toast.success(
        `${tradeDialog.side.toUpperCase()} ${size} lots of ${tradeDialog.pair} at ${formatPrice(tradeDialog.pair, execPrice)}`,
      );
      setTradeDialog((d) => ({ ...d, open: false }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Trade failed");
    }
  };

  const marginRequired = () => {
    const size = Number.parseFloat(lotSize);
    if (Number.isNaN(size)) return 0;
    // Simplified: 1% margin (100:1 leverage)
    return size * LOT_SIZE_USD * tradeDialog.price * 0.01;
  };

  const currentDialogPrice = prices.get(tradeDialog.pair);

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Markets
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Live forex rates — updated every 3s
        </p>
      </div>

      {/* Markets Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card-glass rounded-xl overflow-hidden"
        data-ocid="markets.table"
      >
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3 border-b border-border/50 text-xs font-mono text-muted-foreground uppercase tracking-wider">
          <span>Pair</span>
          <span>Bid</span>
          <span>Ask</span>
          <span>Change</span>
          <span className="text-right">Action</span>
        </div>

        {/* Rows */}
        {FOREX_PAIRS.map((pair, index) => {
          const p = prices.get(pair);
          if (!p) return null;
          const isUp = p.direction === "up";
          const changePositive = p.changePercent >= 0;

          return (
            <motion.div
              key={pair}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-center px-4 py-3.5 border-b border-border/30 last:border-0 hover:bg-accent/30 transition-colors group"
            >
              {/* Pair */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                  <span className="text-[8px] font-bold font-mono text-muted-foreground">
                    {pair.replace("/", "\n")}
                  </span>
                </div>
                <div>
                  <p className="font-display font-semibold text-sm">{pair}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Forex
                  </p>
                </div>
              </div>

              {/* Bid */}
              <span className="font-mono text-sm font-medium text-foreground">
                {formatPrice(pair, p.bid)}
              </span>

              {/* Ask */}
              <span className="font-mono text-sm font-medium text-foreground">
                {formatPrice(pair, p.ask)}
              </span>

              {/* Change */}
              <div className="flex items-center gap-1">
                {isUp ? (
                  <TrendingUp className="w-3 h-3 text-profit" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-loss" />
                )}
                <Badge
                  variant="outline"
                  className={`text-xs font-mono px-1.5 border-0 ${
                    changePositive
                      ? "bg-profit-muted text-profit"
                      : "bg-loss-muted text-loss"
                  }`}
                >
                  {changePositive ? "+" : ""}
                  {p.changePercent.toFixed(3)}%
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  data-ocid={`markets.buy.button.${index + 1}`}
                  size="sm"
                  onClick={() => openTrade(pair, TradeSide.buy, p.ask)}
                  className="h-7 px-3 text-xs font-mono font-bold bg-profit-muted text-profit hover:bg-profit hover:text-background border border-profit/30 transition-all"
                  variant="outline"
                >
                  BUY
                </Button>
                <Button
                  data-ocid={`markets.sell.button.${index + 1}`}
                  size="sm"
                  onClick={() => openTrade(pair, TradeSide.sell, p.bid)}
                  className="h-7 px-3 text-xs font-mono font-bold bg-loss-muted text-loss hover:bg-loss hover:text-background border border-loss/30 transition-all"
                  variant="outline"
                >
                  SELL
                </Button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Trade Dialog */}
      <Dialog
        open={tradeDialog.open}
        onOpenChange={(o) =>
          !placeTrade.isPending && setTradeDialog((d) => ({ ...d, open: o }))
        }
      >
        <DialogContent
          className="bg-popover border-border/60 max-w-sm"
          data-ocid="trade.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <span
                className={`text-sm font-mono px-2 py-0.5 rounded ${
                  tradeDialog.side === TradeSide.buy
                    ? "bg-profit-muted text-profit"
                    : "bg-loss-muted text-loss"
                }`}
              >
                {tradeDialog.side.toUpperCase()}
              </span>
              {tradeDialog.pair}
            </DialogTitle>
            <DialogDescription className="font-mono text-sm">
              {tradeDialog.side === TradeSide.buy ? "Ask" : "Bid"}:{" "}
              <span className="text-foreground font-semibold">
                {currentDialogPrice
                  ? formatPrice(
                      tradeDialog.pair,
                      tradeDialog.side === TradeSide.buy
                        ? currentDialogPrice.ask
                        : currentDialogPrice.bid,
                    )
                  : "—"}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="lot-size"
                className="text-xs text-muted-foreground"
              >
                Lot Size
              </Label>
              <Input
                id="lot-size"
                data-ocid="trade.lotsize.input"
                type="number"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                step="0.01"
                min="0.01"
                max="100"
                className="font-mono bg-secondary border-border/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-secondary/50 rounded-md p-3">
                <p className="text-muted-foreground mb-0.5">Volume</p>
                <p className="font-mono font-semibold">
                  {(
                    (Number.parseFloat(lotSize) || 0) * LOT_SIZE_USD
                  ).toLocaleString("en-US")}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-md p-3">
                <p className="text-muted-foreground mb-0.5">Margin Req.</p>
                <p className="font-mono font-semibold text-neon">
                  ${marginRequired().toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              data-ocid="trade.cancel.button"
              variant="outline"
              onClick={() => setTradeDialog((d) => ({ ...d, open: false }))}
              disabled={placeTrade.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-ocid="trade.confirm.button"
              onClick={handleConfirm}
              disabled={placeTrade.isPending}
              className={`flex-1 font-semibold ${
                tradeDialog.side === TradeSide.buy
                  ? "bg-profit text-background hover:bg-profit/90"
                  : "bg-loss text-background hover:bg-loss/90"
              }`}
            >
              {placeTrade.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `Confirm ${tradeDialog.side.toUpperCase()}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
