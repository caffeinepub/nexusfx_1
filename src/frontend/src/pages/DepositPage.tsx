import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownToLine,
  Bitcoin,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useDeposit } from "../hooks/useQueries";

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Credit / Debit Card",
    icon: CreditCard,
    desc: "Instant",
  },
  { id: "bank", label: "Bank Transfer", icon: Building2, desc: "1-3 days" },
  { id: "crypto", label: "Cryptocurrency", icon: Bitcoin, desc: "~30 min" },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [success, setSuccess] = useState(false);
  const deposit = useDeposit();

  const parsedAmount = Number.parseFloat(amount);
  const isValidAmount = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const handleSubmit = async () => {
    if (!isValidAmount) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      await deposit.mutateAsync(parsedAmount);
      setSuccess(true);
      setAmount("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deposit failed");
    }
  };

  if (success) {
    return (
      <div className="p-4 lg:p-6 pb-20 lg:pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          data-ocid="deposit.success_state"
          className="max-w-md mx-auto card-glass rounded-xl p-8 text-center mt-8"
        >
          <div className="w-16 h-16 rounded-full bg-profit-muted flex items-center justify-center mx-auto mb-4 glow-profit">
            <CheckCircle2 className="w-8 h-8 text-profit" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Deposit Successful!
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your account balance has been updated.
          </p>
          <Button
            onClick={() => setSuccess(false)}
            className="w-full"
            style={{
              background: "oklch(0.78 0.18 195)",
              color: "oklch(0.08 0.02 250)",
            }}
          >
            Make Another Deposit
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Deposit Funds
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add funds to your NexusFX account
        </p>
      </div>

      <div className="max-w-lg space-y-6">
        {/* Amount Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="card-glass rounded-xl p-5"
        >
          <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-neon" />
            Amount
          </h2>

          <div className="space-y-4">
            {/* Quick select */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Quick select
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className={`py-2 rounded-md text-sm font-mono font-semibold border transition-all ${
                      amount === String(preset)
                        ? "bg-primary/20 text-neon border-primary/40 glow-neon"
                        : "bg-secondary border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    ${preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom input */}
            <div>
              <Label
                htmlFor="deposit-amount"
                className="text-xs text-muted-foreground mb-1.5 block"
              >
                Custom amount (USD)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  $
                </span>
                <Input
                  id="deposit-amount"
                  data-ocid="deposit.amount.input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  className="pl-7 font-mono bg-secondary border-border/60 text-lg font-semibold"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="card-glass rounded-xl p-5"
        >
          <h2 className="font-display font-semibold text-sm mb-4">
            Payment Method
          </h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? "bg-primary/10 border-primary/30 text-foreground"
                      : "bg-secondary/50 border-border/40 text-muted-foreground hover:border-border"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-md flex items-center justify-center ${
                      isSelected ? "bg-primary/20" : "bg-secondary"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${isSelected ? "text-neon" : ""}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${isSelected ? "text-foreground" : ""}`}
                    >
                      {method.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {method.desc}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-neon" />}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Error state */}
        <AnimatePresence>
          {deposit.isError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive" data-ocid="deposit.error_state">
                <AlertDescription>
                  {deposit.error instanceof Error
                    ? deposit.error.message
                    : "Deposit failed. Please try again."}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
        >
          <Button
            data-ocid="deposit.submit.button"
            onClick={handleSubmit}
            disabled={!isValidAmount || deposit.isPending}
            className="w-full h-12 font-display font-semibold text-base gap-2"
            style={{
              background: isValidAmount ? "oklch(0.78 0.18 195)" : undefined,
              color: isValidAmount ? "oklch(0.08 0.02 250)" : undefined,
            }}
          >
            {deposit.isPending ? (
              <>
                <Loader2
                  className="w-4 h-4 animate-spin"
                  data-ocid="deposit.loading_state"
                />
                Processing...
              </>
            ) : (
              <>
                <ArrowDownToLine className="w-4 h-4" />
                Deposit{" "}
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
