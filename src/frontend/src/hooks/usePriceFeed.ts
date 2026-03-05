import { useCallback, useEffect, useState } from "react";

export interface PairPrice {
  pair: string;
  bid: number;
  ask: number;
  mid: number;
  change: number;
  changePercent: number;
  direction: "up" | "down" | "neutral";
  prevMid: number;
}

const BASE_PRICES: Record<string, number> = {
  "EUR/USD": 1.0852,
  "GBP/USD": 1.2643,
  "USD/JPY": 149.82,
  "AUD/USD": 0.6521,
  "USD/CAD": 1.3587,
  "NZD/USD": 0.6012,
  "USD/CHF": 0.8921,
  "EUR/GBP": 0.8582,
};

const SPREAD: Record<string, number> = {
  "EUR/USD": 0.00012,
  "GBP/USD": 0.00015,
  "USD/JPY": 0.012,
  "AUD/USD": 0.00014,
  "USD/CAD": 0.00018,
  "NZD/USD": 0.00016,
  "USD/CHF": 0.00017,
  "EUR/GBP": 0.00013,
};

const VOLATILITY: Record<string, number> = {
  "EUR/USD": 0.0006,
  "GBP/USD": 0.0008,
  "USD/JPY": 0.06,
  "AUD/USD": 0.0007,
  "USD/CAD": 0.0007,
  "NZD/USD": 0.0007,
  "USD/CHF": 0.0006,
  "EUR/GBP": 0.0005,
};

function buildInitialPrices(): Map<string, PairPrice> {
  const map = new Map<string, PairPrice>();
  for (const [pair, mid] of Object.entries(BASE_PRICES)) {
    const spread = SPREAD[pair];
    map.set(pair, {
      pair,
      mid,
      bid: mid - spread / 2,
      ask: mid + spread / 2,
      change: 0,
      changePercent: 0,
      direction: "neutral",
      prevMid: mid,
    });
  }
  return map;
}

export function usePriceFeed(intervalMs = 3000) {
  const [prices, setPrices] =
    useState<Map<string, PairPrice>>(buildInitialPrices);

  const tick = useCallback(() => {
    setPrices((prev) => {
      const next = new Map(prev);
      for (const [pair, current] of prev.entries()) {
        const vol = VOLATILITY[pair];
        const noise = (Math.random() - 0.5) * vol;
        const newMid = current.mid + noise;
        const spread = SPREAD[pair];
        const change = newMid - BASE_PRICES[pair];
        const changePercent = (change / BASE_PRICES[pair]) * 100;
        next.set(pair, {
          pair,
          mid: newMid,
          bid: newMid - spread / 2,
          ask: newMid + spread / 2,
          change,
          changePercent,
          direction: noise > 0 ? "up" : "down",
          prevMid: current.mid,
        });
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [tick, intervalMs]);

  return prices;
}

export function formatPrice(pair: string, price: number): string {
  if (pair === "USD/JPY") {
    return price.toFixed(3);
  }
  return price.toFixed(5);
}

export const FOREX_PAIRS = Object.keys(BASE_PRICES);
