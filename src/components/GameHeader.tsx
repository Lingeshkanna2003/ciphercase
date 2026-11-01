import { ArrowLeft, CheckCircle2, Clapperboard, FolderOpen, RotateCcw, Save } from 'lucide-react';

interface GameHeaderProps {
  activeCaseTitle?: string;
  solvedCount: number;
  saveAvailable: boolean;
  onHome: () => void;
  onReset?: () => void;
}

export default function GameHeader({ activeCaseTitle, solvedCount, saveAvailable, onHome, onReset }: GameHeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand-button" type="button" onClick={onHome} aria-label="Return to case files">
          <span className="brand-seal" aria-hidden="true"><Clapperboard size={20} strokeWidth={1.7} /></span>
          <span className="brand-copy">
            <span className="brand-name">CipherCase</span>
            <span className="brand-subtitle">Bureau of unusual events</span>
          </span>
        </button>

        <nav className="topbar-nav" aria-label="Game status">
          <button type="button" className={`topbar-nav-button ${activeCaseTitle ? 'is-active' : ''}`} onClick={onHome}>
            {activeCaseTitle ? <ArrowLeft size={15} /> : <FolderOpen size={15} />}
            <span>{activeCaseTitle ? activeCaseTitle : 'Case files'}</span>
          </button>
          <span className="topbar-count"><CheckCircle2 size={15} /> {solvedCount} solved</span>
          <span className="save-status" title={saveAvailable ? 'Progress saves in this browser' : 'Browser storage is unavailable'}>
            {saveAvailable ? <Save size={14} /> : <RotateCcw size={14} />}
            <span>{saveAvailable ? 'Saved on this device' : 'Local save unavailable'}</span>
          </span>
          {onReset && <button type="button" className="reset-save-button" onClick={onReset}>Reset progress</button>}
        </nav>
      </div>
    </header>
  );
}
