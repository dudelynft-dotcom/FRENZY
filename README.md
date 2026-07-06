# Feeding Frenzy

A live onchain ocean where every fish is real money. Buy $CHUM, stake it in your fish, hunt smaller fish for winnings, and surface before something bigger takes a bite. Your deposit is always safe. Only your winnings are ever at stake.

This repository is the web app: the marketing site, the real time arena, the $CHUM buy page, and the player dashboard.

## Stack

- Next.js 14 (App Router) and TypeScript
- Tailwind CSS with a custom design system (no default palette)
- A self contained HTML canvas game engine for the arena
- Self hosted fonts, no external requests at build time

## Getting started

```sh
npm install
npm run dev
```

Then open the local URL that Next prints (http://localhost:3000, or the next free port).

```sh
npm run build   # production build
npm run start   # serve the production build
npm run lint    # lint
```

## Routes

- `/` the landing page
- `/play` the arena. Swim, hunt, secure, survive
- `/buy` buy $CHUM on the bonding curve
- `/rules` the full player guide with diagrams
- `/dashboard` your fish, balances, upgrades, and the weekly leaderboard

## How the game works

- Every fish holds $CHUM. The more it holds, the bigger it is and the higher its tier (Spawn, Snapper, Barracuda, Shark, Orca, Leviathan).
- **Deposit** is your protected stake. It is never lost, not even in the sea.
- **Winnings** are what you grab on a dive. They are at risk below the surface and become safe the moment you surface. Secure them into your deposit with one click.
- Combat is health based. On contact, both fish bite $CHUM off each other and lose HP. The stronger fish wins the exchange, but a small fast fish can dart in, bite, and dart out before it is taken down.
- Upgrade **Attack** and **Defense** with $CHUM. Ninety percent of every upgrade is burned, ten percent funds the weekly leaderboard.

## Token

$CHUM is bought and sold on a bonding curve.

- Total supply: 10,000,000,000
- Starting fully diluted value: $100,000
- Price rises 0.05% for every $1,000 that flows through the curve

## Onboarding

Log in with email or X and an embedded EVM wallet is created for you automatically. Your fish is free. Claim it onchain in one click with a small claim fee, buy some $CHUM, and dive in. No whitelist, no mint.

## Status

Prototype. The game, the buy curve, the dashboard, and the login flow currently run on mock state so the full experience is playable without a chain. The onchain layer is next.

## Project layout

```
app/            routes (landing, play, buy, rules, dashboard) and layout
components/     arena engine and UI, auth, dashboard, brand
lib/            small helpers
```
