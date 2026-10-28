import { LoaderCircle } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { CellPosition, GameState } from '../api/types';
import { cellKey, formatPosition } from '../utils/format';
import { Mark } from './Mark';

interface BoardProps {
  game: GameState;
  disabled: boolean;
  onPlay: (cell: CellPosition) => void;
}

/** Straight neon tubes, drawn once behind the cells. */
function GridLines() {
  return (
    <svg className="board__lines" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M100 10 V 290" />
      <path d="M200 10 V 290" />
      <path d="M10 100 H 290" />
      <path d="M10 200 H 290" />
    </svg>
  );
}

export function Board({ game, disabled, onPlay }: BoardProps) {
  const isOver = game.status !== 'InProgress';
  // Order of each winning cell, used to sweep the highlighter across the line.
  const winningOrder = new Map(game.winningCells.map((cell, index) => [cellKey(cell), index]));

  return (
    <div
      className={isOver ? 'board board--over' : 'board'}
      role="group"
      aria-label={isOver ? 'Game board, locked' : 'Game board'}
      aria-busy={disabled}
    >
      <GridLines />
      {disabled && (
        // Fades in after a short delay, so quick responses don't flash a spinner.
        <span className="board__busy">
          <LoaderCircle aria-hidden="true" focusable="false" />
          <span className="visually-hidden">Updating the game</span>
        </span>
      )}
      {game.board.map((cells, row) =>
        cells.map((value, column) => {
          const position = { row, column };
          const order = winningOrder.get(cellKey(position));
          const isWinning = order !== undefined;

          return (
            <button
              key={cellKey(position)}
              type="button"
              className={isWinning ? 'cell cell--winning' : 'cell'}
              style={isWinning ? ({ '--order': order } as CSSProperties) : undefined}
              disabled={disabled || isOver || value !== null}
              aria-label={`${formatPosition(position)}, ${value ?? 'empty'}${isWinning ? ', winning cell' : ''}`}
              onClick={() => onPlay(position)}
            >
              {value && <Mark key={value} player={value} />}
            </button>
          );
        }),
      )}
    </div>
  );
}
