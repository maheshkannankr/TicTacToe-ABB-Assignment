# Tic Tac Toe

## 1. Project Overview

This is a browser-based Tic Tac Toe game built with React and TypeScript.

The application supports:

- Two Player Mode (Multiplayer).
- Play Against Computer Mode (Single Player), with five difficulty levels.
- A welcome menu and a guided game setup with a coin toss.
- A 3 × 3 Tic Tac Toe board.
- Move history.
- Undo functionality.
- Session scoreboard.
- Match history of finished games.
- Game reset.
- Scoreboard reset.

The application is designed with a clear separation between the UI and game logic. The game rules and state transitions are handled by a dedicated game engine, while the React UI is responsible for displaying the current state and handling user interactions.

---

## 2. Tech Stack

| Area | Technology |
| --- | --- |
| UI | React 18 with TypeScript (strict mode) |
| Build and Dev Server | Vite 5 |
| Icons | lucide-react |

No UI component library or external state-management library is used. The application state is small and is managed through the `useGame` hook.

---

## 3. Features Implemented

### Main Menu

The application opens on a "Welcome to Tic Tac Toe" menu with:

- Start Game.
- Continue Game (shown only when a game is unfinished).
- Match History.
- Scoreboard.
- How to Play.

### Game Setup

Start Game walks the player through a short setup:

1. **Mode:** choose Single Player (against the computer) or Multiplayer (two players on one device). In Multiplayer, both players can enter their names (optional, up to 20 characters).
2. **Level:** in Single Player, choose the computer's difficulty (see section 4).
3. **Coin Toss:** the player (or Player 1) calls Heads or Tails while the coin spins. "Skip the toss" lets the player choose a side directly.
4. **Side:** the toss winner picks X or O. X always moves first. If the computer wins the toss, it takes X and makes the opening move.

### Game Modes

The application provides two game modes:

1. Two Player Mode
2. Play Against Computer Mode

In Two Player Mode:

- Player X and Player O are controlled by users.
- X starts the game.
- Players alternate turns.

In Computer Mode:

- The human plays the side chosen after the coin toss, and the computer plays the other side.
- Skipping the toss and choosing X gives the standard setup: the human is X and the computer is O.
- The computer automatically makes a move after the human player's valid move.

### Game Board

The game uses a standard 3 × 3 board.

- Each cell is represented as an interactive button.
- Empty cells can be selected.
- Once selected, a cell displays X or O.
- Occupied cells cannot be selected again.
- The board becomes disabled when the game is completed.

### Player Turns

A players bar shows who plays X and who plays O, and the side to move is lit up.

The current player's turn is clearly displayed.

Examples:

`Your move (X)` or `Asha's move (O)`

The turn changes only after a valid move.

Invalid moves do not change the current player.

### Win Detection

The game detects wins across:

- Rows.
- Columns.
- Diagonals.

When a player wins:

- The winner is displayed.
- The winning cells are highlighted.
- The board is locked.
- The scoreboard is updated.
- Further moves are prevented.

### Draw Detection

A game is considered a draw when all nine cells are filled without a winner.

When a draw occurs:

- A draw message is displayed.
- The board is locked.
- The scoreboard is updated.
- Further moves are prevented.

### Move History

The application displays the move history for the current game.

Each move contains:

- Move number.
- Player.
- Cell position.

Example:

| Move | Player | Position |
| --- | --- | --- |
| 1 | X | Row 1, Column 1 |
| 2 | O | Row 2, Column 2 |
| 3 | X | Row 1, Column 2 |

The history updates after every valid move.

### Undo Last Move

The application provides an Undo Last Move control.

In Two Player Mode:

- Undo removes the most recent move.
- The turn is restored to the player whose move was removed.

In Computer Mode:

- Undo removes the human player's previous move and the computer's response together.
- The game returns to the human player's turn.
- If the computer opened the game as X, its opening move is never undone.

Undo is disabled when:

- There are no moves to undo.
- The game has already been completed.

### Reset Game

Reset Game:

- Clears the board.
- Clears move history.
- Clears winner status.
- Clears draw status.
- Sets the current player back to X.
- Starts a fresh game with the same players, sides and level.

Reset Game does not modify the scoreboard.

Reset Game is available while a game is in progress. Once a game is won or drawn, Reset is disabled and the next game is started with New Game.

### New Game

New Game returns to the setup screens so the players can choose a new mode, level and sides.

### Scoreboard

The application maintains a session-level scoreboard containing:

- X Wins.
- O Wins.
- Draws.

A completed game is counted only once.

The application also provides a Reset Scoreboard control that resets all scores to zero.

The scoreboard is shown next to the board and on its own Scoreboard screen.

### Match History

The Match History screen lists every finished game in the session, newest first.

Each entry shows:

- The players and their sides.
- The result.
- The mode and level.
- The number of moves and the time.

Opening an entry shows the final board, with the winning line highlighted, and the full move list.

### How to Play

A How to Play screen explains the rules, the setup, the controls and the computer levels.

### Visual Theme

The game uses a neon-sign theme:

- X glows cyan and O glows pink.
- The grid is drawn as violet neon tubes.
- Marks light up as they are placed.
- Winning cells pulse in the winner's colour.
- Undo, Reset and New Game are round neon icon buttons.

The page is always dark, because neon needs a dark background.

---

## 4. Computer Move Logic

In Single Player, the computer plays at one of five levels.

| Level | Name | How it plays |
| --- | --- | --- |
| 1 | Novice | Picks any free cell at random |
| 2 | Easy | Takes a winning move if it has one, otherwise plays at random |
| 3 | Medium | Wins if it can, blocks if it has to, otherwise plays at random |
| 4 | Hard (default) | The required five-step priority strategy |
| 5 | Unbeatable | Looks ahead to the end of the game (minimax) and never loses |

Hard, the default level, follows the priority required by the assessment:

1. If the computer can win, play the winning move.
2. If the opponent can win next, block it.
3. Take the center if available.
4. Take a corner if available.
5. Take any available cell.

At every level:

- The computer only selects valid, empty cells.
- The computer does not make a move after the game has been completed.

---

## 5. Game State

The application maintains the following game information:

```text
id              game identifier
mode            TwoPlayer | Computer
humanPlayer     the human's side in Computer mode (null in Two Player mode)
difficulty      the computer's level (null in Two Player mode)
playerNames     display name for X and for O
board           3 × 3 grid of X, O or empty
currentPlayer   X | O
status          InProgress | Won | Draw
winner          X | O | null
winningCells    the three cells of the winning line
moves           move history (move number, player, row, column)
canUndo         whether Undo is currently allowed
```

The scoreboard (`xWins`, `oWins`, `draws`) and the match history are kept separately from the current game.

Supported game statuses:

```text
InProgress
Won
Draw
```

The game engine is responsible for determining:

- Current player.
- Valid moves.
- Game status.
- Winner.
- Winning cells.
- Move history.
- Whether Undo is allowed.
- Computer moves.
- Scoreboard updates.
- Match history.

The UI renders the state provided by the game engine rather than independently calculating game results.

---

## 6. UI Behavior

The game screen provides the following controls:

- Undo Last Move.
- Reset Game.
- New Game.
- Reset Scoreboard.
- Main Menu.

Undo, Reset and New Game are icon buttons. Each has its full name as a hover tooltip and as its accessible label.

### Cell States

#### Empty Cell

- Clickable.
- Displays no mark.

#### Selected Cell

- Displays X or O.
- Disabled.

#### Winning Cell

- Displays X or O.
- Highlighted with a glowing outline that pulses.
- Disabled.

#### Completed Game

- All cells are disabled.
- Marks that are not part of the winning line are dimmed.
- Additional moves are prevented.
- Winner or draw status is displayed.
- Undo and Reset are disabled, and a message says to start a new game.

### Loading States

- While the application starts, the menu shows "Loading your scoreboard…" and its buttons wait.
- While a move is being processed, the board is marked busy and a spinner fades in if the action takes more than a moment.

### Action Processing

Controls are disabled while an action is being processed to prevent duplicate actions such as double-clicking a cell multiple times.

If an action is rejected, an appropriate message is displayed without incorrectly changing the game state.

---

## 7. Responsive Design

The application is designed to work comfortably across different screen sizes.

It was checked on screen sizes from a 320 × 568 phone to a 1920 × 1080 desktop.

The board scales with both the width and the height of the window, so the following stay visible and usable without scrolling:

- Players/current turn.
- Game board.
- Game status.
- Game controls.

The move history and scoreboard sit beside the board on wide screens and below it on narrow screens.

There is no horizontal overflow at any size.

---

## 8. Accessibility

The application follows basic accessibility practices.

- Game cells are implemented as accessible buttons and can be used with the keyboard.
- Buttons have meaningful labels, including the icon-only buttons.
- Disabled controls use appropriate disabled states.
- Game status is communicated clearly.
- Status updates are announced to screen readers.
- Winning cells are distinguished by an outline and a pulse, not by colour alone, and are labelled as winning cells.
- When the screen changes, focus moves to the new screen's heading.
- Animations respect the user's reduced-motion preference.

---

## 9. Testing

The application includes 46 tests for the core game logic and user interactions.

Run them with:

```bash
npm test
```

### Game Logic Tests

Tests cover:

- Valid moves.
- Invalid moves.
- Turn switching.
- Row wins.
- Column wins.
- Diagonal wins.
- Draw detection.
- Move after game completion.
- Computer move selection.
- Each computer level, including a check that Unbeatable never loses in any possible game.

### Undo Tests

Tests cover:

- Undo in Two Player Mode.
- Undo in Computer Mode.
- Undo when there are no moves.
- Undo after game completion.
- Undo around the computer's opening move.

### Scoreboard Tests

Tests cover:

- X win.
- O win.
- Draw.
- Counting a completed game only once.
- Resetting the scoreboard.
- Reset Game preserving the scoreboard.

### UI Tests

Tests cover:

- Welcome menu.
- Game setup: mode, level, coin toss and side.
- Board rendering (nine empty, clickable cells).
- Cell interaction.
- Turn display.
- Winner display.
- Draw display.
- Winning-cell highlighting.
- Move history.
- Undo behavior.
- Reset Game.
- Scoreboard.
- Reset Scoreboard.
- Loading states.
- Error handling.
- Completed-game behavior.
- Match History and Continue Game.
- How to Play.

The coin toss is injected into the app in tests, so the result is fixed rather than random.

---

## 10. Test Coverage

The required assessment scenarios are covered by the following test areas:

| Required Case | Covered By |
| --- | --- |
| Board renders correctly | UI tests |
| Nine cells are displayed | UI tests |
| Empty cell can be selected | Game API and UI tests |
| Occupied cell cannot be selected | Game API and UI tests |
| X and O are displayed correctly | UI tests |
| Valid move | Game API tests |
| Invalid move | Game API tests |
| Turn switching | Game API and UI tests |
| Row win | Game rules and UI tests |
| Column win | Game rules tests |
| Diagonal win | Game rules tests |
| Draw | Game rules, game API and UI tests |
| Winning cells are highlighted | UI tests |
| Move history updates correctly | UI tests |
| Reset game | Game API and UI tests |
| Undo in Two Player Mode | Game API and UI tests |
| Undo in Computer Mode | Game API and UI tests |
| Undo disabled when there are no moves | UI tests |
| Scoreboard update | Game API and UI tests |
| Reset Scoreboard | Game API and UI tests |
| Computer move selection | Game rules tests |
| Computer follows the required move priority | Game rules tests |
| Move after game completion | Game API and UI tests |
| Loading and error states | UI tests |

Test files:

- Game rules tests: `src/mocks/rules.test.ts`
- Game API tests: `src/mocks/mockGameApi.test.ts`
- UI tests: `src/App.test.tsx`

---

## 11. Design Decisions

### Game Engine as the Source of Truth

The game engine is responsible for game rules and state transitions.

The UI does not independently determine:

- Who won.
- Whose turn it is.
- Which cells are winning cells.
- Whether Undo is allowed.
- Which move the computer should make.

The UI sends an action to the game engine and renders the resulting state.

### Move History as the Basis for Game State

The game engine stores the moves made during the current game.

The board, current player, game status and winning cells are derived from the move history.

This keeps related pieces of game state synchronized and makes Undo easier to implement.

### Computer Replies in the Same Action

The computer's reply is made as part of the human's move.

This means the computer can never move twice or move after the game has ended, and the UI does not need to coordinate two separate steps.

### Undo Behavior

Undo behavior depends on the selected game mode:

- Two Player Mode removes one move.
- Computer Mode removes the human move and the computer response together.

### Undo After Game Completion

Option A is used:

- Undo is disabled after a game is Won or Drawn.
- The scoreboard remains final for the completed game.

The game engine enforces this rule, not only the UI. A finished game reports that it cannot be undone, and an undo attempt is rejected.

This prevents a completed result from being reversed and keeps scoreboard behavior predictable.

### Single Game State Hook

UI state and game actions are managed through the `useGame` hook.

This keeps game-related UI behavior centralized and prevents multiple components from maintaining conflicting game state.

The hook also blocks a second action while one is still being processed, so a double click cannot make two moves.

### Screens Without a Router

The six screens (menu, setup, game, match history, scoreboard and how to play) are switched with a single piece of state in `App`, so no routing library is needed.

---

## 12. AI Tools and Prompt Summary

> Review and personalize this section before submitting. The "What I Changed Manually" part must describe what you did yourself.

### Tool Used

Claude Code (Anthropic's coding assistant) inside VS Code.

### Converting the Requirement into a Specification

Before building the UI, the requirements were turned into:

- Typed models for the game (`src/api/types.ts`).
- A list of the rules the game engine must follow.
- A checklist of required test cases, matched to tests in section 10.

### Prompts Used

1. The full assignment brief, with the instruction to focus on the React frontend only.

2. "I just want to present in a neon way", which led to the neon theme.
3. A landing page with Start Game, history and other menu options, a choice between Single Player and Multiplayer, and a coin toss to choose sides.
4. Disabling the board after a win or draw, five difficulty levels for Single Player, and a responsive layout where everything fits on screen.

### What the AI Generated

- The React screens, components and the `useGame` hook.
- The game engine and computer move logic.
- The neon styling and responsive layout.
- The first drafts of this README.
- Game Start Menu

### What I Changed Manually

- Disabling the undo button, reset button after the game is completed state,
- Added the Lucid Icons replacing the Buttons Text

### What I Reviewed Carefully

- Undo in Computer Mode removes both moves and never removes the computer's opening move.
- A completed game is scored exactly once, and the game engine itself refuses Undo after completion.
- The UI never decides the winner, the turn or the computer's move.
- The computer's priority order, and that the Unbeatable level never loses.
- Double clicks cannot make two moves.

---

## 13. Clarifications and Assumptions

- The original assessment mentions both Angular and React in different sections. The technology requirements specify React.js, so this implementation uses React with TypeScript.
- This implementation focuses on the frontend portion of the assessment.
- X always starts a new game.
- **Deviation from the brief:** the brief has the human as X and the computer as O in Computer Mode. A coin toss to choose sides was added, so the human plays whichever side the toss gives them, and the computer takes X when it wins the toss. Skipping the toss and choosing X gives exactly the setup in the brief.
- Reset Game clears only the current game and does not reset the scoreboard.
- Reset Game is disabled after a game is completed; New Game starts the next game.
- Undo is disabled after a game is completed (Option A).
- A completed game is counted in the scoreboard only once.
- The default computer level (Hard) uses the five-step priority strategy specified in the assessment. The other levels are additions.
- The scoreboard counts X wins and O wins, as the brief asks, rather than wins per person. Because players can change sides, Match History shows each winner by name.
- Player names are only used in Multiplayer. In Single Player the players are "You" and "Computer".
- Game state is maintained for the current session.

---

## 14. Known Limitations

- Game state, scoreboard and match history are maintained in memory.
- Refreshing the browser clears the current game, scoreboard and match history.
- The scoreboard is session-level and shared across modes.
- Match history is not paged and cannot be cleared on its own.
- The browser back button does not move between screens; the on-screen back buttons do.
- Levels 1 to 3 use random choices, so those games cannot be replayed exactly.
- End-to-end browser testing is not currently included.

---

## 15. Future Improvements

Possible future improvements include:

- Persist game state, scoreboard and match history using browser storage.
- Add Playwright end-to-end tests.
- Add player-specific and per-mode statistics.
- Add URL-based routing so the browser back button works between screens.
- Add arrow-key navigation across the board.
- Add configurable board sizes.
- Add additional visual themes.
- Add sound effects.
- Add online multiplayer support.

---

## 16. Project Structure

```text
src/
│
├── api/
│   ├── types.ts            game models
│   ├── gameApi.ts          the interface the UI uses to talk to the game engine
│   ├── client.ts           request and error helpers
│   └── index.ts            chooses the game engine the app uses
│
├── hooks/
│   └── useGame.ts          all game UI state and actions
│
├── screens/
│   ├── MainMenu.tsx        welcome menu
│   ├── GameSetup.tsx       mode, level, coin toss and side
│   ├── GameScreen.tsx      the board and its panels
│   ├── HistoryScreen.tsx   match history
│   └── InfoScreens.tsx     scoreboard and how to play
│
├── components/
│   ├── Board.tsx
│   ├── Mark.tsx
│   ├── PlayersBar.tsx
│   ├── StatusLine.tsx
│   ├── GameControls.tsx
│   ├── ScoreBoard.tsx
│   ├── MoveHistory.tsx
│   ├── MoveTable.tsx
│   └── ScreenHeader.tsx
│
├── mocks/
│   ├── rules.ts            win/draw detection and computer levels
│   ├── mockGameApi.ts      the game engine
│   ├── rules.test.ts
│   └── mockGameApi.test.ts
│
├── utils/
│   └── format.ts           text for positions, results and matchups
│
├── App.tsx                 picks which screen to show
├── App.test.tsx            UI tests
├── main.tsx
└── styles.css              neon theme and responsive layout
```

---

## 17. Running the Application Locally

### Prerequisites

- Node.js 18 or later.
- npm.

### Installation

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

### Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the development server |
| `npm test` | Runs all tests |
| `npm run test:watch` | Runs tests in watch mode |
| `npm run typecheck` | Runs the TypeScript checker |
| `npm run build` | Builds the application |
| `npm run preview` | Serves the production build locally |

---

## 18. Assessment Acceptance Criteria

The application is considered complete when:

- React application runs successfully.
- 3 × 3 Tic Tac Toe board is displayed.
- X starts every new game.
- Two Player Mode works correctly.
- Computer Mode works correctly.
- Players alternate turns correctly.
- Empty cells can be selected.
- Occupied cells cannot be selected.
- Row wins are detected.
- Column wins are detected.
- Diagonal wins are detected.
- Winning cells are highlighted.
- Draws are detected.
- Completed games prevent additional moves.
- Current player is displayed.
- Winner or draw message is displayed.
- Move history is displayed and updated.
- Undo works correctly in Two Player Mode.
- Undo works correctly in Computer Mode.
- Undo is disabled when there are no moves.
- Undo is disabled after game completion.
- Reset Game works correctly.
- Reset Game preserves the scoreboard.
- Scoreboard displays X wins, O wins and draws.
- Completed games are counted only once.
- Reset Scoreboard works correctly.
- Computer follows the required move-selection priority.
- Loading and error states are handled.
- UI is responsive.
- Basic accessibility requirements are met.
- Core functionality is covered by tests.
