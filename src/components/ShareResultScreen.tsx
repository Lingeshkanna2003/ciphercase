import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, Copy, ShieldCheck } from 'lucide-react';
import type { CaseFile, SharedResult } from '../types/game';

interface ShareResultScreenProps {
  caseFile: CaseFile;
  result: SharedResult;
  onOpenCase: () => void;
  onCopy: () => void;
  notice: string;
  onHome: () => void;
}

export default function ShareResultScreen({ caseFile, result, onOpenCase, onCopy, notice, onHome }: ShareResultScreenProps) {
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(result.solvedAt));
  return (
    <main className="page-shell share-screen">
      <button className="back-link" type="button" onClick={onHome}><ArrowLeft size={15} /> Case files</button>
      <section className="share-card" aria-labelledby="share-title">
        <div className="share-stamp"><BadgeCheck size={24} /></div>
        <p className="eyebrow"><span className="eyebrow-line" /> Case file {caseFile.caseNumber} <span className="eyebrow-separator">/</span> Result shared</p>
        <h1 id="share-title">A case, closed.</h1>
        <p className="share-case-title">{caseFile.title}</p>
        <div className="share-score"><span className="score-label">DEDUCTION SCORE</span><strong>{result.score.toLocaleString()}<small> pts</small></strong><span className="share-score-rule" /></div>
        <div className="share-stats"><span><ShieldCheck size={15} /> {result.difficulty} approach</span><span><Copy size={14} /> {result.hintsUsed} {result.hintsUsed === 1 ? 'hint' : 'hints'}</span><span><Clock3 size={14} /> {date}</span></div>
        <div className="share-actions"><button className="primary-button" type="button" onClick={onOpenCase}>Investigate this case <ArrowRight size={16} /></button><button className="quiet-button" type="button" onClick={onCopy}>Copy result link</button></div>
        <p className="share-notice" role="status" aria-live="polite">{notice || 'This link shares your score only. No notes or personal data are included.'}</p>
      </section>
    </main>
  );
}
