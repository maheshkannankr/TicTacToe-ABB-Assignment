# Tic Tac Toe (React frontend)

## 1. Project overview

A browser-based Tic Tac Toe client built with React. You can play two-player or against a basic
computer opponent, see the move history, undo moves, and keep a session scoreboard.

**Scope of this submission: frontend only.** The UI is written against a REST contract for a
.NET backend (documented below) that owns all game rules, sessions and the scoreboard. That
backend is not part of this repository. To let the app run and be reviewed on its own, it ships
with an **in-browser mock API** (`src/mocks/`) that implements the same contract and rules. The
UI talks to the mock through the same `GameApi` interface it would use for the real HTTP API, so
switching to a real backend is a configuration change, not a code change.

## 2. Tech stack

| Area | Choice |
| --- | --- |
| UI | React 18 + TypeScript (strict) |
| Build / dev server | Vite 5 (dev proxy forwards `/api` to the backend) |
| API style | REST + JSON over `fetch` (`src/api/`) |
| Storage | Server-side, in memory (the mock keeps state in memory for the page's lifetime) |
| Tests | Vitest, React Testing Library, user-event, jsdom |

No UI or state-management libraries: the state is small and lives in one hook (`useGame`).

## 3. Features implemented

- **Main menu**: "Welcome to Tic Tac Toe" with Start game, Continue game (when a game is
  unfinished), Match history, Scoreboard and How to play.
- **Start game flow** in three steps:
  1. Choose **Single player** (against the computer) or **Multiplayer** (two players on one
     device, with optional names).
  2. **Coin toss**: you (or Player 1) call Heads or Tails, and the coin spins. "Skip the toss"
     lets the caller pick directly.
  3. The **toss winner picks X or O**. X always moves first. If the computer wins the toss, it
     takes X and opens the game.
- **Match history** screen: every finished game with players, result, mode, time, the final
  board (winning line highlighted) and the full move list.
- 3 × 3 board. Empty cells are clickable buttons; filled cells show X or O and stay locked.
- Players bar showing who plays X and who plays O, with the side to move lit up.
- Turn indicator ("Asha's move (X)", "Your move (O)") that only changes after a valid move.
- Win detection for rows, columns and diagonals, with the winner shown, the winning cells
  highlighted and the board locked: every cell is disabled, the non-winning marks dim, **Undo** and
  **Reset** are disabled, and a hint says to start a new game.
- Draw detection when all 9 cells are filled with no winner.
- **Reset game** clears the board, history and result and gives X the move. The scoreboard is
  kept.
- **Move history** table (move number, player, "Row r, Column c"), updated after every move.
- **Undo last move**: one move in two-player mode, the computer's reply plus your move in
  computer mode. Disabled when there is nothing to undo and once the game is over.
- **Scoreboard** (X wins, O wins, draws), served by the API, counted once per finished game,
  with a separate **Reset scoreboard** button.
- **Computer mode**: you play the side from the toss and the computer plays the other, at one of
  five levels picked before the toss:

  | Level | Name | How it plays |
  | --- | --- | --- |
  | 1 | Novice | Any free cell, at random |
  | 2 | Easy | Takes a winning move, otherwise random |
  | 3 | Medium | Wins, then blocks, otherwise random |
  | 4 | Hard (default) | The brief's strategy: win → block → center → corner → any free cell |
  | 5 | Unbeatable | Full minimax search; it never loses |
- **New game** (back to setup) and **Main menu** buttons on the game screen.
- Server error messages (for example from rejected moves) are shown to the player.
  Controls are disabled while a request is in flight, which prevents double moves.
- Neon-sign visual theme: glowing cyan X and pink O that light up when placed, a violet grid,
  and winning cells that pulse in the winner's colour. The page is always dark, because neon
  needs a dark background.
- Accessible markup: cells are labelled buttons, the status line is a live region, and the
  animations are turned off when the OS asks for reduced motion.
- Responsive layout, checked from 320 × 568 phones to 1920 × 1080 desktops: the board sizes
  itself to the viewport's width *and* height, so the players bar, status, board and controls fit
  on one screen without scrolling, and nothing scrolls sideways.

## 4. Running the backend locally

Not included (frontend-only scope). `npm run dev` uses the built-in mock, so **no backend is
needed to run or review the app**.

If a .NET API implementing the contract below is available:

```bash
cp .env.example .env     # set VITE_API_PROXY_TARGET to the API's URL, e.g. http://localhost:5000
npm run dev:api          # /api/* is proxied to that URL
```

## 5. Running the frontend locally

Requires Node.js 18 or later.

```bash
npm install
npm run dev              # http://localhost:5173, runs against the in-browser mock API
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with the mock API (no backend needed) |
| `npm run dev:api` | Dev server that calls the real API through the `/api` proxy |
| `npm test` | Runs all tests once |
| `npm run test:watch` | Runs tests in watch mode |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build that runs on the mock API |
| `npm run build:api` | Production build that calls the real API |

Any other way of starting Vite (`npx vite`, VS Code's script runner) also uses the mock. The app
calls a real API only when `VITE_USE_MOCK=false`, which the `:api` scripts set through `.env.api`.

| Env variable | Default | Purpose |
| --- | --- | --- |
| `VITE_USE_MOCK` | unset (mock); `false` in `.env.api` | `false` calls the real API instead of the in-browser mock |
| `VITE_API_PROXY_TARGET` | `http://localhost:5000` | Where the dev server forwards `/api/*` |
| `VITE_API_BASE_URL` | `/api` | Base URL the browser calls. Use a full URL for a deployed API (it then needs CORS) |

## 6. API endpoint summary

JSON is camelCase and enums are strings (in ASP.NET Core, add `JsonStringEnumConverter`). Board
coordinates are **zero-based**; the UI displays them one-based.

| Method | Path | Body | Returns | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/api/games` | `CreateGameRequest` (below) | `GameState` | Create a game session |
| `GET` | `/api/games/{id}` | | `GameState` | Get the current game state |
| `POST` | `/api/games/{id}/moves` | `{ "player": "X", "row": 0, "column": 2 }` | `GameState` | Submit a move |
| `POST` | `/api/games/{id}/undo` | | `GameState` | Undo (one move, or a pair in computer mode) |
| `POST` | `/api/games/{id}/reset` | | `GameState` | Fresh board with the same mode, sides and names |
| `GET` | `/api/history` | | `GameSummary[]` | Finished games, newest first |
| `GET` | `/api/scoreboard` | | `Scoreboard` | Get the scoreboard |
| `POST` | `/api/scoreboard/reset` | | `Scoreboard` | Reset the scoreboard to zero |

The game ID is in the path; the move body carries the player and the cell.

```jsonc
// CreateGameRequest
{
  "mode": "Computer",                // "TwoPlayer" | "Computer"
  "humanPlayer": "O",                // Computer mode only: the human's side from the toss (default "X")
  "difficulty": "Hard",              // Computer mode only: Novice | Easy | Medium | Hard | Unbeatable (default Hard)
  "playerNames": { "X": "Computer", "O": "You" }   // optional; blanks fall back to defaults
}

// GameState
{
  "id": "3f2c…",
  "mode": "Computer",
  "humanPlayer": "O",                // null in two-player mode
  "difficulty": "Hard",              // null in two-player mode
  "playerNames": { "X": "Computer", "O": "You" },
  "board": [["X", null, null], [null, "O", null], [null, null, null]],
  "currentPlayer": "X",
  "status": "InProgress",            // "InProgress" | "Won" | "Draw"
  "winner": null,                    // "X" | "O" | null
  "winningCells": [],                // e.g. [{ "row": 0, "column": 0 }, …] when won
  "moves": [
    { "moveNumber": 1, "player": "X", "row": 0, "column": 0 },
    { "moveNumber": 2, "player": "O", "row": 1, "column": 1 }
  ],
  "canUndo": true
}

// GameSummary (one entry of GET /api/history)
{
  "id": "h-7", "gameId": "3f2c…", "mode": "TwoPlayer", "humanPlayer": null, "difficulty": null,
  "playerNames": { "X": "Asha", "O": "Ben" },
  "board": [["X", "X", "X"], ["O", "O", null], [null, null, null]],
  "status": "Won", "winner": "X", "winningCells": [ … ], "moves": [ … ],
  "finishedAt": "2026-10-28T06:26:41.000Z"
}

// Scoreboard
{ "xWins": 2, "oWins": 1, "draws": 0 }
```

The coin toss runs in the browser because it's pre-game UI, not a game rule. Its outcome
reaches the server as `humanPlayer` and `playerNames` when the game is created.

The scoreboard is not part of `GameState`. The client fetches it on load, after a game finishes,
and after undoing a finished game.

**Errors.** Invalid requests never change game state or the turn. Errors use ProblemDetails
(`detail` / `title`) or `{ "message" }`, and the UI shows the text to the player, so it should
read as a user-facing sentence.

| Status | When |
| --- | --- |
| `400` | Cell outside the board, unknown mode, or `humanPlayer` not X/O |
| `404` | Unknown game ID |
| `409` | Occupied cell, wrong player, move after the game is over, or undo with no moves |

**Behaviour the UI relies on**

- **Computer mode:** the human plays `humanPlayer` and the computer plays the other side. X
  always moves first, so when the computer is X, `POST /games` (and reset) return the board with
  the computer's opening move already made. After each human move the API applies the computer's
  reply in the **same request**, chosen according to the game's `difficulty`. If the human's move
  ends the game, the computer does not move. An unknown difficulty is rejected with 400.
- **Undo, two-player:** removes the latest move only.
- **Undo, computer mode:** removes the computer's move and the human move before it. If the human
  ended the game (so the computer never replied), only that move is removed. The computer's
  opening move is never undone; `canUndo` is false until the human has moved.
- **Reset:** clears moves and result for that game ID, keeping mode, sides and names. The
  scoreboard and history are untouched; a result already counted stays counted.
- **History:** a game is added when it finishes. If undo reopens it, that entry is removed
  together with its scoreboard point, so history and scoreboard always agree.

The mock (`src/mocks/rules.ts`, `src/mocks/mockGameApi.ts`) implements exactly these rules, so it
also works as a reference for the C# service and its unit tests.

## 7. Running tests

```bash
npm test
```

42 tests in three files:

| File | Covers |
| --- | --- |
| `src/mocks/rules.test.ts` | Row, column and diagonal wins; draw versus in progress; computer priority (win, block, center, corner, any); each level (Novice ignores wins, Easy wins but does not block, Medium blocks, Hard is the default, Unbeatable stops a fork Hard walks into and never loses against every possible line) |
| `src/mocks/mockGameApi.test.ts` | Valid move and turn switch; out-of-board, occupied-cell and wrong-player rejection; move after completion; draw scoring; undo in two-player mode; undo in computer mode (pair, and single move when X wins); computer not moving after the game ends; scored once and reversed on undo; reset keeps the scoreboard; reset scoreboard; player names; computer opening as X, and undo/reset around that opener; history entries added, ordered, dropped on undo and kept on reset; difficulty stored, defaulted to Hard and validated |
| `src/App.test.tsx` | Rendering and API integration through the UI: welcome menu; the five computer levels and the chosen level reaching the game; mode → toss → side flow (toss loser and winner); turns and history; winner highlight, locked board (disabled cells and hint) and scoring; reset game; draw and reset scoreboard; computer winning the toss and opening; undo in both modes; server error shown with the turn unchanged; match history and Continue game; How to play |

The coin is injected into `App` (`flipCoin`, `tossDelayMs`), so the UI tests decide the toss
result instead of depending on chance.

## 8. AI tools and prompt summary

> Review and personalize this section before submitting. The panel will ask about it.

- **Tool:** Claude Code (Anthropic) in VS Code.
- **Workflow:**
  1. Turned the brief into a spec: a typed API contract (`src/api/types.ts`), the rule list in
     section 6, and the test checklist from the brief.
  2. Had the AI generate the React app, the mock API and the tests against that contract.
  3. Reviewed the output against the brief's acceptance criteria. Gaps were then fixed: the
     move request had no `player`, there was no reset endpoint, the default script required a
     backend, and some required test cases were missing.
- **Example prompt:** the full assignment brief, plus "I'm only focusing on the frontend, so
  only the React project is enough, no need for the backend."
- **Reviewed carefully:** undo in computer mode when X wins (only one move to remove); scoring
  exactly once, and reversing the score when undo reopens a finished game; the computer's move
  priority order; double-click protection while a request is in flight.

## 9. Design decisions

- **Server is the source of truth.** The UI never computes winners, turns or computer moves. It
  sends one request per action and renders the returned `GameState`. Client checks (for example
  ignoring clicks on filled cells) are only there to avoid pointless requests.
- **`GameApi` interface** with two implementations (HTTP and mock). This keeps the backend
  swappable and lets UI tests run against realistic behaviour without network stubs.
- **Moves are the stored state.** The mock stores only the move list; board, turn, status and
  winning cells are derived from it. Undo becomes "drop the last N moves", and the state can't
  drift out of sync.
- **Computer reply in the same request** as the human move. There is no race, the computer can't
  move twice, and the UI doesn't have to sequence two calls.
- **One hook (`useGame`)** holds all client state. A ref-based busy guard rejects a second click
  before React re-renders.
- **Game ID in `sessionStorage`**, so a refresh resumes the game while the server still has it
  (with the mock, a refresh starts fresh).
- **Screens without a router.** Six screens (menu, setup, game, history, scoreboard, rules) are
  switched with one state value in `App`, so there's no routing dependency. Focus moves to each
  screen's heading for keyboard and screen-reader users.
- **History entries carry the final board** from the server, so the client draws past games
  without replaying moves.

## 10. Clarifications and assumptions

- **Scoreboard and undo: Option A in the UI (no undo after completion).** Once a game is won or
  drawn, Undo and Reset are disabled and the player starts a new game, so a finished result is
  final. The API contract still supports undoing a finished game (it takes the result back off the
  scoreboard and history, so a game never counts twice); the UI simply doesn't offer it.
- The brief mentions both Angular and React. The technology section says React, so this is a
  React app.
- Frontend-only scope (see section 1). The mock stands in for the .NET API.
- Reset Game keeps the same game ID, mode, sides and names (`POST /games/{id}/reset`). **New
  game** goes back through setup and creates a game with `POST /games`. An unfinished game is
  abandoned and not scored.
- **Deviation from the brief: the human can play O.** The brief fixes the human as X in
  computer mode. A coin toss to choose sides was requested on top of that, so the human plays
  whichever side the toss gives them, and the computer takes X when it wins. "Skip the toss"
  with X reproduces the brief's original setup exactly. X always moves first, and Reset still
  gives X the first move.
- The scoreboard counts X wins and O wins, as the brief asks, not wins per person. Since sides
  can change between games, the history screen shows who won each game by name.
- Player names are optional, at most 20 characters, and only used in multiplayer. In single
  player the names are "You" and "Computer".

## 11. Known limitations

- No real backend in this repo, so the mock's state (games, history, scoreboard) lasts only
  until the page reloads.
- A single shared scoreboard: no per-user or per-mode scores.
- Match history is not paged and can't be cleared separately.
- The browser back button doesn't move between screens (no router); the on-screen back
  buttons do.
- The computer follows the required heuristic, not minimax, so it can be beaten with a fork.
- No end-to-end browser tests (component and integration tests only).

## 12. Future improvements

- Implement the ASP.NET Core API from this contract, porting `rules.ts` and its tests to xUnit.
- Generate the TypeScript types from the API's OpenAPI document so they can't drift.
- Add Playwright end-to-end tests against the real API.
- Add difficulty levels (minimax), per-player and per-mode scoreboards, and history filters.
- URL-based routing so browser back/forward and deep links work.
- Keyboard arrow-key navigation across the board.

## Project structure

```
src/
  api/          types.ts (contract), client.ts (fetch + errors), gameApi.ts (endpoints), index.ts (mock/HTTP switch)
  hooks/        useGame.ts: all client state, one request per action, double-click guard
  screens/      MainMenu, GameSetup (mode, coin toss, side), GameScreen, HistoryScreen, InfoScreens (scoreboard, rules)
  components/   Board, Mark, PlayersBar, StatusLine, GameControls, ScoreBoard, MoveHistory, MoveTable, ScreenHeader
  mocks/        rules.ts + mockGameApi.ts: in-browser implementation of the API contract
  utils/        format.ts: positions, result and matchup text
  App.tsx       picks the current screen
```
