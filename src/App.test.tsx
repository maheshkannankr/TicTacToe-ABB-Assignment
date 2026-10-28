import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { ApiError } from './api/client';
import type { GameApi } from './api/gameApi';
import { createMockGameApi } from './mocks/mockGameApi';
import type { CoinSide } from './screens/GameSetup';

const cellName = (row: number, column: number) => new RegExp(`^Row ${row}, Column ${column},`);
const cell = (row: number, column: number) => screen.getByRole('button', { name: cellName(row, column) });
const button = (name: string | RegExp) => screen.getByRole('button', { name });

interface SetupOptions {
  api?: GameApi;
  /** What the coin lands on. */
  coin?: CoinSide;
}

async function setup({ api = createMockGameApi(), coin = 'Heads' }: SetupOptions = {}) {
  const user = userEvent.setup();
  render(<App api={api} flipCoin={() => coin} tossDelayMs={0} />);
  await screen.findByRole('heading', { name: 'Welcome to Tic Tac Toe' });
  // Wait for the initial scoreboard load to enable the menu.
  await screen.findByRole('button', { name: 'Start game' }).then((el) => expect(el).toBeEnabled());

  /** Menu → mode → toss (call Heads) → side → start. */
  const startGame = async ({
    mode,
    side,
    names,
    level,
  }: {
    mode: 'Single player' | 'Multiplayer';
    side?: 'X' | 'O';
    names?: [string, string];
    level?: number;
  }) => {
    await user.click(button('Start game'));
    await user.click(await screen.findByRole('button', { name: new RegExp(`^${mode}`) }));
    if (mode === 'Single player') await user.click(button(new RegExp(`^Level ${level ?? 4}:`)));
    if (names) {
      await user.type(screen.getByLabelText('Player 1 name'), names[0]);
      await user.type(screen.getByLabelText('Player 2 name'), names[1]);
    }
    await user.click(button('Heads'));
    if (side) await user.click(await screen.findByRole('button', { name: new RegExp(`^Play ${side}`) }));
    await user.click(await screen.findByRole('button', { name: 'Start game' }));
    await screen.findByRole('group', { name: 'Game board' });
  };

  const play = async (row: number, column: number) => {
    await user.click(cell(row, column));
    await screen.findByRole('button', { name: new RegExp(`^Row ${row}, Column ${column}, [XO]`) });
  };

  const score = (label: string) => {
    const board = screen.getByRole('region', { name: 'Scoreboard' });
    return within(board).getByText(label).nextElementSibling?.textContent;
  };

  return { user, startGame, play, score };
}

describe('App', () => {
  it('opens on a welcome menu', async () => {
    await setup();
    const menu = screen.getByRole('navigation', { name: 'Main menu' });
    expect(within(menu).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Start game',
      'Match history',
      'Scoreboard',
      'How to play',
    ]);
  });

  it('asks for a mode, tosses a coin and lets the toss winner pick a side', async () => {
    const { user } = await setup({ coin: 'Tails' });
    await user.click(button('Start game'));
    expect(screen.getByRole('heading', { name: 'How do you want to play?' })).toBeInTheDocument();

    await user.click(button(/^Multiplayer/));
    await user.type(screen.getByLabelText('Player 1 name'), 'Asha');
    await user.type(screen.getByLabelText('Player 2 name'), 'Ben');
    await user.click(button('Heads'));

    // Asha called Heads, the coin landed Tails, so Ben picks.
    expect(await screen.findByText("It's Tails! Ben won the toss.")).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ben, pick your side' })).toBeInTheDocument();
    await user.click(button(/^Play O/));

    expect(await screen.findByText('Asha plays X and moves first')).toBeInTheDocument();
    expect(screen.getByText('Ben plays O')).toBeInTheDocument();
    await user.click(button('Start game'));

    expect(await screen.findByRole('status')).toHaveTextContent("Asha's move (X)");
    expect(screen.getByText('Multiplayer')).toBeInTheDocument();
  });

  it('asks single players for one of five computer levels and plays at that level', async () => {
    const { user } = await setup();
    await user.click(button('Start game'));
    await user.click(button(/^Single player/));

    expect(screen.getByRole('heading', { name: "Pick the computer's level" })).toBeInTheDocument();
    const levels = screen.getAllByRole('button', { name: /^Level [1-5]:/ });
    expect(levels.map((b) => b.textContent)).toEqual([
      'Level 1: NovicePlays any free cell',
      'Level 2: EasyTakes a win when it sees one',
      'Level 3: MediumWins and blocks you',
      'Level 4: HardWins, blocks, then center and corners',
      'Level 5: UnbeatableNever loses. Aim for a draw',
    ]);

    await user.click(button(/^Level 5: Unbeatable/));
    await user.click(button('Heads'));
    await user.click(await screen.findByRole('button', { name: /^Play X/ }));
    expect(screen.getByText('Unbeatable')).toBeInTheDocument();
    await user.click(button('Start game'));

    expect(await screen.findByText('Single player · Unbeatable')).toBeInTheDocument();
  });

  it('alternates turns, records move history and resets mid-game', async () => {
    const { user, startGame, play } = await setup();
    await startGame({ mode: 'Multiplayer', side: 'X', names: ['Asha', 'Ben'] });
    expect(button('Undo last move')).toBeDisabled();

    await play(1, 1);
    expect(screen.getByRole('status')).toHaveTextContent("Ben's move (O)");
    expect(cell(1, 1)).toBeDisabled();

    await play(2, 2);
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows.map((r) => r.textContent)).toEqual([
      'MovePlayerPosition',
      '1XRow 1, Column 1',
      '2ORow 2, Column 2',
    ]);

    await user.click(button('Reset game'));
    expect(await screen.findByText('No moves yet. X goes first.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent("Asha's move (X)");
  });

  it('shows the winner, highlights the line, locks the board and scores once', async () => {
    const { startGame, play, score } = await setup();
    await startGame({ mode: 'Multiplayer', side: 'X' });
    for (const [row, column] of [[1, 1], [2, 1], [1, 2], [2, 2], [1, 3]]) {
      await play(row, column);
    }

    expect(await screen.findByRole('status')).toHaveTextContent('Player 1 wins!');
    expect(screen.getAllByRole('button', { name: /winning cell/ })).toHaveLength(3);
    expect(cell(3, 3)).toBeDisabled();
    expect(screen.getByRole('group', { name: 'Game board, locked' })).toBeInTheDocument();
    expect(screen.getByText(/Game over. Start a new game/)).toBeInTheDocument();
    expect(await screen.findByText('1', { selector: '.tally__item--x dd' })).toBeInTheDocument();
    expect(score('X wins')).toBe('1');

    expect(button('Undo last move')).toBeDisabled();
    expect(button('Reset game')).toBeDisabled();
    expect(button('New game')).toBeEnabled();
  });

  it('shows a draw, scores it, and resets the scoreboard on request', async () => {
    const { user, startGame, play, score } = await setup();
    await startGame({ mode: 'Multiplayer', side: 'X' });
    for (const [row, column] of [[1, 1], [1, 2], [1, 3], [2, 2], [2, 1], [2, 3], [3, 2], [3, 1], [3, 3]]) {
      await play(row, column);
    }

    expect(await screen.findByRole('status')).toHaveTextContent("It's a draw");
    expect(await screen.findByText('1', { selector: '.tally__item:not(.tally__item--x):not(.tally__item--o) dd' })).toBeInTheDocument();
    expect(score('Draws')).toBe('1');

    await user.click(button('Reset scoreboard'));
    expect(await screen.findByRole('button', { name: 'Reset scoreboard' })).toBeDisabled();
    expect(score('Draws')).toBe('0');
    expect(screen.getByRole('status')).toHaveTextContent("It's a draw");
  });

  it('lets the computer open when it wins the toss, and keeps that opener on undo', async () => {
    const { user, startGame, play } = await setup({ coin: 'Tails' });
    await startGame({ mode: 'Single player' });

    // Computer took X and the center.
    expect(screen.getByRole('button', { name: /^Row 2, Column 2, X/ })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Your move (O)');
    expect(button('Undo last move')).toBeDisabled();

    await play(1, 1);
    expect(await screen.findAllByRole('row')).toHaveLength(4);

    await user.click(button('Undo last move'));
    expect(await screen.findByRole('button', { name: /^Row 1, Column 1, empty/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Row 2, Column 2, X/ })).toBeInTheDocument();
    expect(button('Undo last move')).toBeDisabled();
  });

  it('undoes the human move and the computer reply together', async () => {
    const { user, startGame, play } = await setup();
    await startGame({ mode: 'Single player', side: 'X' });
    expect(screen.getByText(/Undo takes back your last move/)).toBeInTheDocument();

    await play(1, 1);
    expect(await screen.findByRole('button', { name: /^Row 2, Column 2, O/ })).toBeInTheDocument();

    await user.click(button('Undo last move'));
    expect(await screen.findByText('No moves yet. X goes first.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Your move (X)');
  });

  it('undoes a single move in two-player mode', async () => {
    const { user, startGame, play } = await setup();
    await startGame({ mode: 'Multiplayer', side: 'X' });
    await play(1, 1);
    await play(2, 2);

    await user.click(button('Undo last move'));
    expect(await screen.findByRole('button', { name: /^Row 2, Column 2, empty/ })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent("Player 2's move (O)");
  });

  it('shows the server error for a rejected move and keeps the turn', async () => {
    const api = createMockGameApi();
    const rejecting: GameApi = {
      ...api,
      makeMove: () => Promise.reject(new ApiError("It's O's turn, not X's.", 409)),
    };
    const { user, startGame } = await setup({ api: rejecting });
    await startGame({ mode: 'Multiplayer', side: 'X' });

    await user.click(cell(1, 1));
    expect(await screen.findByRole('alert')).toHaveTextContent("It's O's turn, not X's.");
    expect(screen.getByRole('status')).toHaveTextContent("Player 1's move (X)");
    expect(cell(1, 1)).toBeEnabled();
  });

  it('lists finished games in match history and offers to continue an unfinished one', async () => {
    const { user, startGame, play } = await setup();
    await startGame({ mode: 'Multiplayer', side: 'X', names: ['Asha', 'Ben'] });
    for (const [row, column] of [[1, 1], [2, 1], [1, 2], [2, 2], [1, 3]]) {
      await play(row, column);
    }
    await screen.findByText('Asha wins!');

    await user.click(button('New game'));
    await user.click(button(/^Single player/));
    await user.click(button(/^Level 4: Hard/));
    await user.click(button('Skip the toss'));
    await user.click(button(/^Play X/));
    await user.click(button('Start game'));
    await play(3, 3);

    await user.click(button(/Main menu/));
    await user.click(button('Match history'));
    const matches = await screen.findAllByRole('listitem');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toHaveTextContent('Asha (X) vs Ben (O)');
    expect(matches[0]).toHaveTextContent('Asha won');
    expect(matches[0]).toHaveTextContent('Multiplayer · 5 moves');

    await user.click(button(/Main menu/));
    await user.click(button('Continue game'));
    expect(await screen.findByRole('button', { name: /^Row 3, Column 3, X/ })).toBeInTheDocument();
  });

  it('shows the rules', async () => {
    const { user } = await setup();
    await user.click(button('How to play'));
    expect(screen.getByRole('heading', { name: 'How to play', level: 1 })).toHaveFocus();
    expect(screen.getByText(/Whoever wins the toss picks X or O/)).toBeInTheDocument();
  });
});
