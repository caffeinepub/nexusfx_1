import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  ArrowUpFromLine,
  CheckCircle2,
  Landmark,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useBalance, useWithdraw } from "../hooks/useQueries";

const PRESET_AMOUNTS = [100, 500, 1000];

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [success, setSuccess] = useState(false);
  const withdraw = useWithdraw();
  const { data: balance } = useBalance();

  const parsedAmount = Number.parseFloat(amount);
  const isValidAmount = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const hasInsufficientFunds = isValidAmount && parsedAmount > (balance ?? 0);

  const handleSubmit = async () => {
    if (!isValidAmount) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (hasInsufficientFunds) {
      toast.error("Insufficient balance");
      return;
    }
    try {
      await withdraw.mutateAsync(parsedAmount);
      setSuccess(true);
      setAmount("");
      setDestination("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Withdrawal failed");
    }
  };

  if (success) {
    return (
      <div className="p-4 lg:p-6 pb-20 lg:pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          data-ocid="withdraw.success_state"
          className="max-w-md mx-auto card-glass rounded-xl p-8 text-center mt-8"
        >
          <div className="w-16 h-16 rounded-full bg-profit-muted flex items-center justify-center mx-auto mb-4 glow-profit">
            <CheckCircle2 className="w-8 h-8 text-profit" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Withdrawal Submitted!
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your withdrawal request is being processed.
          </p>
          <Button
            onClick={() => setSuccess(false)}
            className="w-full"
            style={{
              background: "oklch(0.78 0.18 195)",
              color: "oklch(0.08 0.02 250)",
            }}
          >
            Make Another Withdrawal
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Withdraw Funds
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Withdraw funds from your NexusFX account
        </p>
      </div>

      <div className="max-w-lg space-y-6">
        {/* Balance info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card-glass rounded-xl p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-muted-foreground">Available Balance</p>
            <p className="font-display text-2xl font-bold text-neon font-mono">
              $
              {(balance ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-neon" />
          </div>
        </motion.div>

        {/* Amount Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="card-glass rounded-xl p-5"
        >
          <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4 text-loss" />
            Withdrawal Amount
          </h2>

          <div className="space-y-4">
            {/* Quick select */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Quick select
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className={`py-2 rounded-md text-sm font-mono font-semibold border transition-all ${
                      amount === String(preset)
                        ? "bg-primary/10 text-neon border-primary/40"
                        : "bg-secondary border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    ${preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <Label
                htmlFor="withdraw-amount"
                className="text-xs text-muted-foreground mb-1.5 block"
              >
                Custom amount (USD)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  $
                </span>
                <Input
                  id="withdraw-amount"
                  data-ocid="withdraw.amount.input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  max={balance ?? undefined}
                  className={`pl-7 font-mono bg-secondary border-border/60 text-lg font-semibold ${
                    hasInsufficientFunds ? "border-destructive" : ""
                  }`}
                />
              </div>
              {hasInsufficientFunds && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Amount exceeds available balance
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Destination */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="card-glass rounded-xl p-5"
        >
          <h2 className="font-display font-semibold text-sm mb-4">
            Destination Account
          </h2>
          <div>
            <Label
              htmlFor="destination"
              className="text-xs text-muted-foreground mb-1.5 block"
            >
              Bank account / wallet address
            </Label>
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter bank account or wallet address"
              className="bg-secondary border-border/60 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              UI only — no actual funds are transferred
            </p>
          </div>
        </motion.div>

        {/* Error state */}
        <AnimatePresence>
          {withdraw.isError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive" data-ocid="withdraw.error_state">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  {withdraw.error instanceof Error
                    ? withdraw.error.message
                    : "Withdrawal failed. Please try again."}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
        >
          <Button
            data-ocid="withdraw.submit.button"
            onClick={handleSubmit}
            disabled={
              !isValidAmount || hasInsufficientFunds || withdraw.isPending
            }
            variant="outline"
            className="w-full h-12 font-display font-semibold text-base gap-2 border-loss/40 hover:bg-loss/10 hover:text-loss"
          >
            {withdraw.isPending ? (
              <>
                <Loader2
                  className="w-4 h-4 animate-spin"
                  data-ocid="withdraw.loading_state"
                />
                Processing...
              </>
            ) : (
              <>
                <ArrowUpFromLine className="w-4 h-4" />
                Withdraw{" "}
                {isValidAmount
                  ? `$${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "Funds"}
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
