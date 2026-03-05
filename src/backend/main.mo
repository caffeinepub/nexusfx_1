import Order "mo:core/Order";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type TransactionId = Nat;
  type TradeId = Nat;

  type TransactionType = {
    #deposit;
    #withdraw;
  };

  type TradeSide = {
    #buy;
    #sell;
  };

  type Transaction = {
    id : TransactionId;
    transactionType : TransactionType;
    amount : Float;
    timestamp : Time.Time;
  };

  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Int.compare(t1.timestamp, t2.timestamp);
    };
  };

  type Position = {
    id : TradeId;
    pair : Text;
    side : TradeSide;
    lotSize : Float;
    entryPrice : Float;
    openTimestamp : Time.Time;
  };

  module Position {
    public func compare(p1 : Position, p2 : Position) : Order.Order {
      Int.compare(p1.openTimestamp, p2.openTimestamp);
    };
  };

  type ClosedTrade = {
    id : TradeId;
    pair : Text;
    side : TradeSide;
    lotSize : Float;
    entryPrice : Float;
    closePrice : Float;
    pnl : Float;
    openTimestamp : Time.Time;
    closeTimestamp : Time.Time;
  };

  module ClosedTrade {
    public func compare(c1 : ClosedTrade, c2 : ClosedTrade) : Order.Order {
      Int.compare(c1.closeTimestamp, c2.closeTimestamp);
    };
  };

  type UserAccount = {
    balance : Float;
    nextTransactionId : TransactionId;
    nextTradeId : TradeId;
    transactions : Map.Map<TransactionId, Transaction>;
    openPositions : Map.Map<TradeId, Position>;
    closedTrades : Map.Map<TradeId, ClosedTrade>;
  };

  module UserAccount {
    public func compare(u1 : UserAccount, u2 : UserAccount) : Order.Order {
      Float.compare(u1.balance, u2.balance);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  let accounts = Map.empty<Principal, UserAccount>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getBalance() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balances");
    };
    getOrCreateAccount(caller).balance;
  };

  public shared ({ caller }) func deposit(amount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can deposit funds");
    };
    if (amount <= 0.0) {
      Runtime.trap("Deposit amount must be positive");
    };

    let account = getOrCreateAccount(caller);
    let newBalance = account.balance + amount;
    let transaction : Transaction = {
      id = account.nextTransactionId;
      transactionType = #deposit;
      amount;
      timestamp = Time.now();
    };

    let accountWithTransaction = {
      account with transactions = account.transactions.clone();
    };
    accountWithTransaction.transactions.add(account.nextTransactionId, transaction);

    let newAccount = {
      accountWithTransaction with
      balance = newBalance;
      nextTransactionId = account.nextTransactionId + 1;
    };
    accounts.add(caller, newAccount);
  };

  public shared ({ caller }) func withdraw(amount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can withdraw funds");
    };
    if (amount <= 0.0) {
      Runtime.trap("Withdraw amount must be positive");
    };

    let account = getOrCreateAccount(caller);

    if (amount > account.balance) {
      Runtime.trap("Insufficient funds");
    };

    let newBalance = account.balance - amount;
    let transaction : Transaction = {
      id = account.nextTransactionId;
      transactionType = #withdraw;
      amount;
      timestamp = Time.now();
    };

    let accountWithTransaction = {
      account with transactions = account.transactions.clone();
    };
    accountWithTransaction.transactions.add(account.nextTransactionId, transaction);

    let newAccount = {
      accountWithTransaction with
      balance = newBalance;
      nextTransactionId = account.nextTransactionId + 1;
    };
    accounts.add(caller, newAccount);
  };

  public query ({ caller }) func getTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };
    let account = getOrCreateAccount(caller);
    account.transactions.values().toArray().sort();
  };

  public shared ({ caller }) func placeTrade(pair : Text, side : TradeSide, lotSize : Float, entryPrice : Float) : async TradeId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can trade");
    };
    if (lotSize <= 0.0 or entryPrice <= 0.0) {
      Runtime.trap("Invalid lot size or entry price");
    };

    let margin = lotSize * entryPrice * 0.01;
    let account = getOrCreateAccount(caller);

    if (margin > account.balance) {
      Runtime.trap("Insufficient margin to open trade");
    };

    let newBalance = account.balance - margin;
    let position : Position = {
      id = account.nextTradeId;
      pair;
      side;
      lotSize;
      entryPrice;
      openTimestamp = Time.now();
    };

    let accountWithPosition = {
      account with openPositions = account.openPositions.clone();
    };
    accountWithPosition.openPositions.add(account.nextTradeId, position);

    let newAccount = {
      accountWithPosition with
      balance = newBalance;
      nextTradeId = account.nextTradeId + 1;
    };
    accounts.add(caller, newAccount);
    position.id;
  };

  public shared ({ caller }) func closeTrade(tradeId : TradeId, closePrice : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can close trades");
    };

    let account = getOrCreateAccount(caller);

    switch (account.openPositions.get(tradeId)) {
      case (null) {
        Runtime.trap("Trade does not exist");
      };
      case (?position) {
        let basePnl = (closePrice - position.entryPrice) * position.lotSize * 100.0;
        let pnl = if (position.side == #sell) { -basePnl } else { basePnl };

        let updatedBalance = account.balance +
          (position.lotSize * position.entryPrice * 0.01) + pnl;

        let closedTrade : ClosedTrade = {
          id = position.id;
          pair = position.pair;
          side = position.side;
          lotSize = position.lotSize;
          entryPrice = position.entryPrice;
          closePrice;
          pnl;
          openTimestamp = position.openTimestamp;
          closeTimestamp = Time.now();
        };

        let accountWithClosedTrade = {
          account with closedTrades = account.closedTrades.clone();
        };
        accountWithClosedTrade.closedTrades.add(position.id, closedTrade);

        let accountWithOpenPositions = {
          accountWithClosedTrade with openPositions = account.openPositions.clone();
        };
        accountWithOpenPositions.openPositions.remove(position.id);

        let newAccount = {
          accountWithOpenPositions with balance = updatedBalance;
        };
        accounts.add(caller, newAccount);
      };
    };
  };

  public query ({ caller }) func getOpenPositions() : async [Position] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view positions");
    };

    let account = getOrCreateAccount(caller);
    account.openPositions.values().toArray().sort();
  };

  public query ({ caller }) func getClosedTrades() : async [ClosedTrade] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };
    let account = getOrCreateAccount(caller);
    account.closedTrades.values().toArray().sort();
  };

  public shared ({ caller }) func resetAccount(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reset accounts");
    };
    accounts.remove(user);
  };

  func getOrCreateAccount(user : Principal) : UserAccount {
    switch (accounts.get(user)) {
      case (?account) { account };
      case (null) {
        let account : UserAccount = {
          balance = 10_000.0;
          nextTransactionId = 0;
          nextTradeId = 0;
          transactions = Map.empty<TransactionId, Transaction>();
          openPositions = Map.empty<TradeId, Position>();
          closedTrades = Map.empty<TradeId, ClosedTrade>();
        };
        accounts.add(user, account);
        account;
      };
    };
  };
};
