import { Button } from "@/components/ui/button";
import { Globe, Shield, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Real-Time Trading",
    desc: "Trade 8 major forex pairs with live prices",
  },
  {
    icon: Shield,
    title: "Secure Identity",
    desc: "Powered by Internet Identity — no passwords",
  },
  {
    icon: Zap,
    title: "Instant Execution",
    desc: "Market orders with immediate confirmation",
  },
  {
    icon: Globe,
    title: "Global Markets",
    desc: "EUR, GBP, USD, JPY and more",
  },
];

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: "oklch(0.78 0.18 195)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-8"
          style={{ background: "oklch(0.72 0.19 155)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative"
      >
        {/* Card */}
        <div className="card-glass rounded-xl p-8 shadow-card">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4 glow-neon"
            >
              <TrendingUp className="w-8 h-8 text-neon" />
            </motion.div>
            <h1 className="font-display text-3xl font-bold text-neon tracking-tight">
              NexusFX
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Professional Forex Trading Platform
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.35 }}
                  className="bg-secondary/50 rounded-lg p-3 border border-border/50"
                >
                  <Icon className="w-4 h-4 text-neon mb-1.5" />
                  <p className="text-xs font-semibold text-foreground">
                    {feature.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 font-display font-semibold text-base glow-neon relative overflow-hidden group"
              style={{
                background: "oklch(0.78 0.18 195)",
                color: "oklch(0.08 0.02 250)",
              }}
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                "Connect with Internet Identity"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Secure, passwordless authentication by DFINITY
            </p>
          </motion.div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-muted-foreground mt-4">
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
      </motion.div>
    </div>
  );
}
