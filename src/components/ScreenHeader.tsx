import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: ReactNode;
  backLabel?: string;
  onBack: () => void;
  children?: ReactNode;
}

/** Back button, the screen's heading, and optional extras (like a mode badge) on the right. */
export function ScreenHeader({ title, backLabel = 'Main menu', onBack, children }: ScreenHeaderProps) {
  return (
    <header className="topbar">
      <button type="button" className="back-button" onClick={onBack}>
        <span aria-hidden="true">←</span> {backLabel}
      </button>
      <h1 className="topbar__title" tabIndex={-1}>
        {title}
      </h1>
      {children && <div className="topbar__extra">{children}</div>}
    </header>
  );
}
