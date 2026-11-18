# Starkeeper — Penjaga Langit Gelap

[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/dyccx/starkeeper/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/dyccx/starkeeper/reward.svg)](https://make.fun/bounty/best-game-01)

A dark-sky arcade game, built for [make.fun's **best-game-01** bounty](https://make.fun/bounty/best-game-01) — "Make the best game", $1,000.

You are **Kunang**, a little firefly-drone over the karst hills of Gunungkidul.
Catch the falling stars, dodge the pink city glare, grab moon shards for a
shield — and survive six nights until dawn breaks over the hills.

## How to play

- **Move:** WASD / arrow keys, or hold the mouse — the drone chases your pointer.
- **Catch** gold stars for points. Catches in a row build a combo (up to +2 per star).
- **Dodge** the pink glare orbs — one hit costs a life (you have 3), and breaks your combo.
- **Moon shards** (cyan crescents) grant an 8-second shield.
- **Win** by surviving all 6 nights (2 minutes) until dawn. **Lose** when your lives run out.
- **P** pauses, **M** mutes, **R** restarts, **Enter** starts.

Every sound is synthesised live with WebAudio — no audio files. The night sky
slowly warms into dawn as you survive, and your best score is kept in the
browser.

## Play it

No build step — the game is static files under `game/`:

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static file server. It makes no network
requests; everything it loads is a file under `game/`.

## Screenshots

`shots.json` lists the four staged shots (`?shot=start|play|win|end&seed=1`).

## Why this game

Its maker is a geography graduate whose thesis mapped light pollution for
astrotourism in Gunungkidul — so the game is about exactly that: keeping a
dark sky alive, one star at a time.

## License

MIT — see [LICENSE](LICENSE).
