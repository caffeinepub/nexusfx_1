import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type TransactionId = bigint;
export type Time = bigint;
export interface Position {
    id: TradeId;
    pair: string;
    side: TradeSide;
    entryPrice: number;
    openTimestamp: Time;
    lotSize: number;
}
export type TradeId = bigint;
export interface ClosedTrade {
    id: TradeId;
    pnl: number;
    closeTimestamp: Time;
    pair: string;
    side: TradeSide;
    closePrice: number;
    entryPrice: number;
    openTimestamp: Time;
    lotSize: number;
}
export interface UserProfile {
    name: string;
}
export interface Transaction {
    id: TransactionId;
    transactionType: TransactionType;
    timestamp: Time;
    amount: number;
}
export enum TradeSide {
    buy = "buy",
    sell = "sell"
}
export enum TransactionType {
    withdraw = "withdraw",
    deposit = "deposit"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    closeTrade(tradeId: TradeId, closePrice: number): Promise<void>;
    deposit(amount: number): Promise<void>;
    getBalance(): Promise<number>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClosedTrades(): Promise<Array<ClosedTrade>>;
    getOpenPositions(): Promise<Array<Position>>;
    getTransactions(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeTrade(pair: string, side: TradeSide, lotSize: number, entryPrice: number): Promise<TradeId>;
    resetAccount(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    withdraw(amount: number): Promise<void>;
}
