import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TradeSide } from "../backend.d";
import { useActor } from "./useActor";

// ===== Balance =====
export function useBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["balance"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getBalance();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

// ===== Transactions =====
export function useTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

// ===== Open Positions =====
export function useOpenPositions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["openPositions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOpenPositions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

// ===== Closed Trades =====
export function useClosedTrades() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["closedTrades"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClosedTrades();
    },
    enabled: !!actor && !isFetching,
  });
}

// ===== User Profile =====
export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

// ===== Deposit Mutation =====
export function useDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      if (!actor) throw new Error("Not connected");
      await actor.deposit(amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["balance"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

// ===== Withdraw Mutation =====
export function useWithdraw() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      if (!actor) throw new Error("Not connected");
      await actor.withdraw(amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["balance"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

// ===== Place Trade Mutation =====
export function usePlaceTrade() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pair,
      side,
      lotSize,
      entryPrice,
    }: {
      pair: string;
      side: TradeSide;
      lotSize: number;
      entryPrice: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.placeTrade(pair, side, lotSize, entryPrice);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["openPositions"] });
      void queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

// ===== Close Trade Mutation =====
export function useCloseTrade() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tradeId,
      closePrice,
    }: {
      tradeId: bigint;
      closePrice: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.closeTrade(tradeId, closePrice);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["openPositions"] });
      void queryClient.invalidateQueries({ queryKey: ["closedTrades"] });
      void queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}
