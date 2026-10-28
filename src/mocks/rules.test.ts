import { describe, expect, it } from 'vitest';
import type { Board, Player } from '../api/types';
import { chooseComputerMove, evaluateBoard } from './rules';

/** Builds a board from rows like 'XO.', where '.' is empty. */
const board = (...rows: string[]): Board =>
  rows.map((row) => [...row].map((ch) => (ch === '.' ? null : (ch as Player))));

describe('evaluateBoard', () => {
  it('detects a row, a column and a diagonal', () => {
    expect(evaluateBoard(board('XXX', 'OO.', '...')).winner).toBe('X');
    expect(evaluateBoard(board('OX.', 'OX.', 'O..')).winner).toBe('O');
    expect(evaluateBoard(board('X.O', '.XO', '..X'))).toMatchObject({
      status: 'Won',
      winner: 'X',
      winningCells: [
        { row: 0, column: 0 },
        { row: 1, column: 1 },
        { row: 2, column: 2 },
      ],
    });
  });

  it('reports a draw only when the board is full with no winner', () => {
    expect(evaluateBoard(board('XOX', 'XOO', 'OXX')).status).toBe('Draw');
    expect(evaluateBoard(board('XOX', 'XOO', 'OX.')).status).toBe('InProgress');
  });
});

describe('chooseComputerMove', () => {
  it('takes a winning move before blocking', () => {
    expect(chooseComputerMove(board('OO.', 'XX.', 'X..'))).toEqual({ row: 0, column: 2 });
  });

  it('blocks X when it cannot win', () => {
    expect(chooseComputerMove(board('XX.', '.O.', '...'))).toEqual({ row: 0, column: 2 });
  });

  it('takes the center, then a corner, then any cell', () => {
    expect(chooseComputerMove(board('X..', '...', '...'))).toEqual({ row: 1, column: 1 });
    expect(chooseComputerMove(board('...', '.X.', '...'))).toEqual({ row: 0, column: 0 });
    expect(chooseComputerMove(board('XOX', 'OXX', 'O.O'))).toEqual({ row: 2, column: 1 });
  });
});

describe('computer levels', () => {
  // Always picks the first free cell, so the random levels are predictable.
  const first = () => 0;

  it('Novice ignores both a win and a block', () => {
    expect(chooseComputerMove(board('...', 'XX.', 'OO.'), 'O', 'Novice', first)).toEqual({ row: 0, column: 0 });
  });

  it('Easy takes a win but does not block', () => {
    expect(chooseComputerMove(board('...', 'XX.', 'OO.'), 'O', 'Easy', first)).toEqual({ row: 2, column: 2 });
    expect(chooseComputerMove(board('...', 'XX.', 'O..'), 'O', 'Easy', first)).toEqual({ row: 0, column: 0 });
  });

  it('Medium blocks but does not go for the center', () => {
    expect(chooseComputerMove(board('...', 'XX.', 'O..'), 'O', 'Medium', first)).toEqual({ row: 1, column: 2 });
    expect(chooseComputerMove(board('X..', '...', '...'), 'O', 'Medium', first)).toEqual({ row: 0, column: 1 });
  });

  it('Hard is the default and follows the brief', () => {
    const b = board('X..', '...', '...');
    expect(chooseComputerMove(b, 'O', 'Hard')).toEqual(chooseComputerMove(b));
  });

  it('Unbeatable stops a fork that Hard walks into', () => {
    // X in opposite corners, O in the center: a corner reply lets X fork, an edge reply holds.
    const fork = board('X..', '.O.', '..X');
    expect(chooseComputerMove(fork, 'O', 'Hard')).toEqual({ row: 0, column: 2 });
    const reply = chooseComputerMove(fork, 'O', 'Unbeatable')!;
    expect(reply.row === 1 || reply.column === 1).toBe(true);
  });

  it('Unbeatable never loses, whatever the opponent plays', () => {
    // Explore every possible X line against an O that always plays perfectly.
    const explore = (b: Board): void => {
      const outcome = evaluateBoard(b);
      expect(outcome.winner).not.toBe('X');
      if (outcome.status !== 'InProgress') return;
      b.flat().forEach((value, index) => {
        if (value !== null) return;
        const next = b.map((row) => [...row]);
        next[Math.floor(index / 3)][index % 3] = 'X';
        if (evaluateBoard(next).status === 'InProgress') {
          const o = chooseComputerMove(next, 'O', 'Unbeatable')!;
          next[o.row][o.column] = 'O';
        }
        explore(next);
      });
    };
    explore(board('...', '...', '...'));
  });
});
