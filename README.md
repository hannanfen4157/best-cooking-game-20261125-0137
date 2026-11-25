# The Golden Ladle — a cozy bistro rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/hannanfen4157/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/hannanfen4157/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original cooking game that plays offline in a desktop browser from its
own static files — an entry for the make.fun bounty
[best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137)
("Make the best cooking game").

## The game

You run a tiny bistro, **The Golden Ladle**, for one 3-minute shift. Orders land on
the board along the top, each listing a dish and the ingredients it needs. Pick
ingredients off the counter, chop what needs chopping on the chopping board, cook
what needs cooking on the stove (and take it off before it burns), build the dish
on your plate, and serve it before the customer loses patience. Fast service earns
tips, streaks build a combo bonus, and three walked-out customers end your shift.

Six dishes, nine ingredients, two stove burners, one chopping board, and a rush
that grows as the shift goes on: orders arrive faster and patience runs shorter.

## How to play

- **Mouse:** click everything — an ingredient to pick it up, the chopping board to
  chop it, a stove burner to cook it or take it off, the plate to add what you are
  carrying, an item on the plate to bin it, and SERVE when the plate matches an order.
- **Keys:** `1`–`9` pick an ingredient, `Space` chops, `Enter` serves, `B` bins what
  you are carrying (or clears the plate), `M` mutes the sound.
- Sounds are synthesised with the Web Audio API — no audio files, no network.

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome:

```sh
node serve.ts
# then open http://localhost:8080
```

The game makes no network request: every script, style and sound is a file under
`game/` or generated in the browser.

## Layout

- `game/index.html` — the page, a canvas and one module script
- `game/css/style.css` — page chrome around the canvas
- `game/src/config.js` — ingredients, recipes, layout, difficulty
- `game/src/random.js` — seeded random, so screenshot scenes replay exactly
- `game/src/state.js` — the state of a shift and its rules
- `game/src/render.js` — the kitchen, drawn on canvas with plain shapes
- `game/src/input.js` — mouse and keyboard
- `game/src/audio.js` — synthesised sounds (Web Audio, no files)
- `game/src/shots.js` — the screenshot scenes behind `?shot=cover|rush|serve|title`
- `game/src/main.js` — the loop that wires it together
- `screenshots/` — 4 screenshots, real renders of the game's own code (see `shots.json`)
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and
  writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`
- `vendor/makefun-game.ts` — the kit's library, unchanged

## Screenshots

`shots.json` maps each screenshot to the scene that produced it:

- `1-cover.jpg` — `?shot=cover`: a dish mid-assembly, pasta on the stove, a mushroom
  half-chopped, three orders on the board
- `2-rush.jpg` — `?shot=rush`: the last minute, one heart left, a finished burger
  ready to serve, soup on the stove
- `3-serve.jpg` — `?shot=serve`: the moment just after a Golden Burger goes out
- `4-title.jpg` — `?shot=title`: the title screen and how to play

## License

MIT — see [LICENSE](LICENSE).
