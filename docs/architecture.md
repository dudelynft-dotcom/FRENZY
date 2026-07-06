# Feeding Frenzy: technical design

This document is the blueprint for turning the prototype into a real, fair, cheat resistant, onchain product. Today the game, the buy curve, the shop, and the dashboard all run on mock client state. This describes what to build to make them real.

The guiding rule: the player's computer is never trusted. The server decides everything that matters, and money settles onchain.

---

## 1. High level shape

Three parts:

1. **Game server (authoritative).** Runs the real time simulation. Owns all positions, health, bites, and winnings. Clients only send inputs and render what the server tells them.
2. **Onchain layer.** Contracts for the token, the fish, staking, securing, withdrawing, cosmetics, and the prize pool. This is the source of truth for money.
3. **Client (this web app).** Renders the world, sends inputs, and reads state. It shows a smooth predicted view but never decides outcomes.

```
Player input  ->  Game server (simulates, decides)  ->  state snapshots  ->  Client (renders)
                        |
                        v
                 Settlement service  ->  Onchain contracts (money is real here)
```

---

## 2. Real time multiplayer

### 2.1 Server authoritative model

- Clients send only **inputs**: movement direction, dash, and secure requests. They never send "I ate this fish" or "I have this much CHUM."
- The server runs the single source of truth simulation at a fixed tick, for example **20 to 30 ticks per second**.
- Each tick the server integrates movement, resolves collisions and bites, updates health, applies winnings, and produces a **snapshot** of nearby entities.
- Snapshots are sent to each client, area of interest filtered so a client only receives entities near its fish. This caps bandwidth and prevents map wide wallhacks.

### 2.2 Client side prediction and reconciliation

- The client predicts its own movement immediately so controls feel instant.
- The server periodically sends the authoritative position. If it differs from the prediction, the client smoothly corrects (reconciliation). Small corrections are invisible, large ones snap.
- Other fish are shown with **entity interpolation**: the client renders them slightly in the past (about 100 milliseconds) and interpolates between the last two snapshots, so movement is smooth even with jittery packets.

### 2.3 Lag compensation

- The server timestamps every input and every snapshot.
- When resolving a bite, the server rewinds the target's position to where it actually was on the attacker's screen at the moment of input (within a bounded window). This makes hits feel fair for players with higher ping, without letting anyone cheat time.
- Cap the rewind window (for example 200 milliseconds). Inputs older than the cap are dropped.

### 2.4 Transport

- **WebSocket** for the control and state channel to start. It is simple, reliable, and works everywhere.
- Move the hot path to **WebTransport or WebRTC data channels (unreliable, unordered)** later for lower latency on position updates, keeping a reliable channel for events like eats, secures, and deaths.
- Binary encoding for snapshots (typed arrays), not JSON, once the format is stable.

### 2.5 Rooms and scale

- The ocean is sharded into **rooms** with a soft player cap (for example 50 to 100 per room). One room is one server process or worker.
- A matchmaker assigns joining players to a room with space, keeping friends and pack members together when possible.
- Rooms are stateless to the client: a player can be migrated between server instances by replaying their authoritative state.
- Horizontal scale by running many room workers behind a router keyed by room id. State per room lives in memory with periodic checkpoints to Redis so a crashed worker can recover.

---

## 3. Anti cheat

Because the server owns the simulation, most classic cheats are impossible by construction. Additional guards:

- **Input validation.** Reject impossible inputs: movement vectors are normalized server side, dash respects the real cooldown, secure only works in the real safe zone.
- **Rate limits.** Cap inputs per second per connection. Drop or throttle floods.
- **Sanity invariants.** A player's staked CHUM only changes through server resolved events. Any client claim to the contrary is ignored.
- **Speed and teleport checks.** The server is the only mover, so a client cannot teleport. Prediction errors beyond a threshold are logged and snapped.
- **Bot and multi account detection.** Behavioral heuristics, device and network signals, and a challenge on suspicious accounts. Wallets are embedded and per account, which helps.
- **Replay and audit.** Every room records an input and event log so any disputed round can be replayed deterministically.

---

## 4. Onchain layer

### 4.1 The split: fast game, slow settlement

Real time combat cannot be onchain, it is too fast and too expensive. The model:

- **Off chain:** the authoritative game server runs combat and tracks each fish's balances in real time.
- **On chain:** deposits, secures, withdrawals, buys, cosmetics, and prize payouts settle onchain. The game server is a trusted settlement operator that submits signed state transitions, with onchain checks and a challenge path.

### 4.2 Contracts

- **CHUM token.** Standard fungible token with a fixed 10,000,000,000 supply. Mint to the bonding curve contract at genesis.
- **Bonding curve.** Holds the CHUM inventory and quotes price on a curve where FDV starts at 100,000 dollars and rises 0.05 percent per 1,000 dollars bought. Buy only until 60 percent of supply is sold, then selling back to the curve unlocks. No trading fee. All parameters are set at deploy and are read only after.
- **Fish (claimable).** A non transferable or transferable token per player. Claiming is free plus a small claim fee. A fish stores its deposit balance onchain.
- **Vault and settlement.** Holds staked CHUM. Exposes deposit, secure, and withdraw. Combat outcomes are applied by the settlement operator through signed batches. A player can always withdraw their onchain deposit even if the operator is offline, because the deposit is never at risk from combat (only unsecured winnings are, and those live in the off chain game session until secured).
- **Cosmetics.** Purchases in CHUM. Splits revenue: a share to the prize pool contract, a share to the treasury.
- **Prize pool.** Accumulates from cosmetics, tournament entries, and reserve top ups. Pays out per season to the leaderboard, using a signed final standings root that anyone can verify.

### 4.3 Trust and safety on settlement

- The operator submits **batched, signed** balance updates, not per bite transactions.
- Users hold a claim path: if the operator withholds a secure or a payout, the user can exit with their last agreed onchain balance after a timeout (an escape hatch, similar to an optimistic rollup exit).
- All contracts are **audited** before mainnet, with a public report. Start with conservative limits and a timelock on any admin function.
- Onchain monitoring and alerting on treasury movements, large buys, and unusual settlement batches.

---

## 5. Backend services

- **Game servers (rooms):** authoritative simulation, one process per room, in memory state, checkpoints to Redis.
- **Matchmaker:** assigns players to rooms, keeps packs together.
- **Settlement service:** collects finalized session results and submits signed batches onchain, with retries and idempotency.
- **API:** auth (embedded wallet on email or X login), profile, seasons, leaderboard, shop inventory, pack membership.
- **Datastore:** Postgres for accounts, seasons, leaderboards, cosmetics ownership, and pack data. Redis for room checkpoints and rate limits.
- **Observability:** structured logs, metrics per room (tick time, player count, packet loss), and error tracking. Dashboards for server health and economy flows.

---

## 6. Economy integrity

- The prize pool is funded only by cosmetics, tournament entries, and the reserve. It is never funded by player deposits. This is enforced by the contracts, not by policy.
- A reserve smooths payouts: skim a small share into reserve during high activity weeks, top up rewards from reserve during quiet weeks.
- All economy parameters that matter (curve, sellout gate, burn split, cosmetic split) are transparent and, where possible, immutable after deploy.

---

## 7. Rollout

1. **Closed alpha, fake money.** Real multiplayer, real netcode, no chain. Invite 50 to 200 players. Measure return rate and fun. Fix the loop.
2. **Closed beta, testnet.** Wire the contracts on a testnet. Exercise claim, buy, stake, secure, withdraw, cosmetics, and a full season payout. Break it on purpose.
3. **Security.** Full audit, a public bug bounty, load tests at target concurrency, and a game day where the team tries to cheat and grief.
4. **Guarded mainnet.** Launch with low limits, close monitoring, and a kill switch. Raise limits as confidence grows.
5. **Scale and content.** Add rooms as load grows. Ship a steady drip of new fish, zones, events, seasons, and cosmetics.

---

## 8. What exists today

The web app in this repository is the client and the design surface. The arena runs a complete single player simulation with the exact rules the multiplayer server will enforce: deposit is safe, only unsecured winnings are at risk, health based combat, hit and run, dash, combos, bounties, frenzies, and the surface safe zone. The buy curve, shop, seasons, and dashboard run on mock state. The step from here is to move the simulation authority to a server, put the money onchain per the contracts above, and follow the rollout.
