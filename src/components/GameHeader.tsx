import { ArrowLeft, CheckCircle2, FolderOpen, RotateCcw, Save, Volume2, VolumeX } from 'lucide-react';
import brandMark from '../assets/brand/ciphercase-mark.png';

interface GameHeaderProps {
  activeCaseTitle?: string;
  solvedCount: number;
  saveAvailable: boolean;
  soundEnabled: boolean;
  onHome: () => void;
  onReset?: () => void;
  onToggleSound: () => void;
}

export default function GameHeader({ activeCaseTitle, solvedCount, saveAvailable, soundEnabled, onHome, onReset, onToggleSound }: GameHeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand-button" type="button" onClick={onHome} aria-label="Return to case files">
          <span className="brand-seal" aria-hidden="true"><img src={brandMark} alt="" /></span>
          <span className="brand-copy">
            <span className="brand-name">CipherCase</span>
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
            <span>{saveAvailable ? 'Saved' : 'Save unavailable'}</span>
          </span>
          <button type="button" className="sound-toggle" onClick={onToggleSound} aria-pressed={soundEnabled} aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'} title={soundEnabled ? 'Sound effects on' : 'Sound effects off'}>{soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}</button>
          {onReset && <button type="button" className="reset-save-button" onClick={onReset}>Reset progress</button>}
        </nav>
      </div>
    </header>
  );
}
