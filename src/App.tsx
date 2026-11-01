import { useEffect, useState } from 'react';
import GameHeader from './components/GameHeader';
import HomeScreen from './components/HomeScreen';
import CaseWorkspace from './components/CaseWorkspace';
import ShareResultScreen from './components/ShareResultScreen';
import { cases, getCaseById } from './data/cases';
import { calculateScore, checkAccusation } from './lib/caseEngine';
import { createCaseProgress, createFreshProgress, loadProgress, SAVE_KEY, saveProgress } from './lib/progress';
import { createShareUrl, readSharedResult } from './lib/sharing';
import type { Accusation, CaseActivity, CaseActivityType, CaseProgress, Difficulty, GameProgress, SharedResult } from './types/game';
import { playSound } from './lib/sound';

function getBrowserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function makeActivity(type: CaseActivityType, message: string): CaseActivity {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return { id, at: new Date().toISOString(), type, message };
}

function addActivity(progress: CaseProgress, type: CaseActivityType, message: string): CaseProgress {
  return { ...progress, activity: [...progress.activity, makeActivity(type, message)].slice(-40) };
}

export default function App() {
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress(getBrowserStorage()));
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [saveAvailable, setSaveAvailable] = useState(() => Boolean(getBrowserStorage()));
  const [accusationFeedback, setAccusationFeedback] = useState('');
  const [shareNotice, setShareNotice] = useState('');
  const activeCase = activeCaseId ? getCaseById(activeCaseId) : undefined;
  const activeProgress = activeCase ? progress.cases[activeCase.id] ?? createCaseProgress() : undefined;
  const sharedResult = typeof window === 'undefined' ? null : readSharedResult(window.location.search, cases);
  const sharedCase = sharedResult ? getCaseById(sharedResult.caseId) : undefined;

  useEffect(() => {
    setSaveAvailable(saveProgress(progress, getBrowserStorage()));
  }, [progress]);

  useEffect(() => {
    document.title = activeCase ? `${activeCase.title} — CipherCase` : 'CipherCase — Detective mysteries';
  }, [activeCase]);

  const goHome = () => {
    setActiveCaseId(null);
    setAccusationFeedback('');
    setShareNotice('');
  };

  const clearShareUrl = () => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
    }
  };

  const openCase = (caseId: string) => {
    const caseFile = getCaseById(caseId);
    if (!caseFile) return;
    setActiveCaseId(caseId);
    setAccusationFeedback('');
    setShareNotice('');
    clearShareUrl();
    playSound(progress.soundEnabled, 'open');
    setProgress((current) => {
      if (current.cases[caseId]) return current;
      const fresh = createCaseProgress();
      const started = addActivity(fresh, 'opened', `Opened ${caseFile.title}.`);
      return { ...current, cases: { ...current.cases, [caseId]: started } };
    });
  };

  const updateCase = (caseId: string, updater: (caseProgress: CaseProgress) => CaseProgress) => {
    setProgress((current) => {
      const caseProgress = current.cases[caseId] ?? createCaseProgress();
      return { ...current, cases: { ...current.cases, [caseId]: updater(caseProgress) } };
    });
  };

  const examineEvidence = (evidenceId: string) => {
    if (!activeCase) return;
    const evidence = activeCase.evidence.find((item) => item.id === evidenceId);
    if (!evidence) return;
    const existing = progress.cases[activeCase.id]?.discoveredEvidenceIds.includes(evidenceId);
    if (!existing) playSound(progress.soundEnabled, 'discover');
    updateCase(activeCase.id, (caseProgress) => {
      if (caseProgress.discoveredEvidenceIds.includes(evidenceId)) return caseProgress;
      const updated = { ...caseProgress, discoveredEvidenceIds: [...caseProgress.discoveredEvidenceIds, evidenceId] };
      return addActivity(updated, 'evidence', `Examined ${evidence.title}.`);
    });
  };

  const logInterview = (suspectId: string) => {
    if (!activeCase) return;
    const suspect = activeCase.suspects.find((item) => item.id === suspectId);
    if (!suspect) return;
    updateCase(activeCase.id, (caseProgress) => {
      if (caseProgress.interviewedSuspectIds.includes(suspectId)) return caseProgress;
      const updated = { ...caseProgress, interviewedSuspectIds: [...caseProgress.interviewedSuspectIds, suspectId] };
      return addActivity(updated, 'interview', `Logged an interview with ${suspect.name}.`);
    });
  };

  const discoverConnection = (connectionId: string) => {
    if (!activeCase) return;
    const connection = activeCase.connections.find((item) => item.id === connectionId);
    if (!connection) return;
    if (!activeProgress?.discoveredConnectionIds.includes(connectionId)) playSound(progress.soundEnabled, 'compare');
    updateCase(activeCase.id, (caseProgress) => {
      if (caseProgress.discoveredConnectionIds.includes(connectionId)) return caseProgress;
      return addActivity({ ...caseProgress, discoveredConnectionIds: [...caseProgress.discoveredConnectionIds, connectionId] }, 'connection', `Connected ${connection.evidenceIds.map((id) => activeCase.evidence.find((item) => item.id === id)?.title ?? 'evidence').join(' and ')}.`);
    });
  };

  const updateBoardOrder = (boardOrder: string[]) => {
    if (!activeCase) return;
    updateCase(activeCase.id, (caseProgress) => ({ ...caseProgress, boardOrder }));
  };

  const addHint = () => {
    if (!activeCase || !activeProgress) return;
    if (activeProgress.hintsUsed >= activeCase.hints.length) return;
    const hintNumber = activeProgress.hintsUsed + 1;
    updateCase(activeCase.id, (caseProgress) => addActivity({ ...caseProgress, hintsUsed: Math.min(caseProgress.hintsUsed + 1, activeCase.hints.length) }, 'hint', `Revealed hint ${hintNumber}.`));
  };

  const makeAccusation = (accusation: Accusation) => {
    if (!activeCase || !activeProgress || activeProgress.result) return;
    const outcome = checkAccusation(activeCase, accusation, activeProgress.discoveredEvidenceIds);
    if (outcome.kind === 'incomplete') {
      setAccusationFeedback('Choose a suspect and two pieces of collected evidence first.');
      return;
    }
    if (outcome.kind === 'uncollected-evidence') {
      setAccusationFeedback('Investigate both pieces of evidence before presenting them.');
      return;
    }
    if (outcome.kind === 'incorrect') {
      updateCase(activeCase.id, (caseProgress) => addActivity({ ...caseProgress, wrongAccusations: caseProgress.wrongAccusations + 1 }, 'accusation', 'An accusation did not fit the evidence.'));
      setAccusationFeedback('That theory does not fit the evidence yet. Review your notes and try again.');
      playSound(progress.soundEnabled, 'error');
      return;
    }

    const result = {
      caseId: activeCase.id,
      score: calculateScore(progress.difficulty, activeProgress.hintsUsed, activeProgress.wrongAccusations),
      difficulty: progress.difficulty,
      hintsUsed: activeProgress.hintsUsed,
      wrongAccusations: activeProgress.wrongAccusations,
      solvedAt: new Date().toISOString(),
    };
    setProgress((current) => {
      const caseProgress = current.cases[activeCase.id] ?? createCaseProgress();
      if (caseProgress.result) return current;
      const solved = addActivity({ ...caseProgress, result }, 'solved', `Closed ${activeCase.title} with a score of ${result.score}.`);
      return {
        ...current,
        cases: { ...current.cases, [activeCase.id]: solved },
        results: { ...current.results, [activeCase.id]: result },
      };
    });
    setAccusationFeedback('The evidence supports your conclusion.');
    playSound(progress.soundEnabled, 'solve');
  };

  const revealShare = async (result?: SharedResult) => {
    if (!result || typeof window === 'undefined') return;
    const url = createShareUrl(result, window.location.href);
    const caseFile = getCaseById(result.caseId);
    const shareText = `${caseFile?.title ?? 'A CipherCase mystery'} — ${result.score.toLocaleString()} points on ${result.difficulty}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CipherCase result', text: shareText, url });
        setShareNotice('Your result was shared.');
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareNotice('A shareable result link was copied.');
        return;
      }
      window.prompt('Copy your CipherCase result link', url);
      setShareNotice('Your result link is ready to copy.');
    } catch {
      setShareNotice('Sharing was cancelled. Your saved case is unchanged.');
    }
  };

  const setDifficulty = (difficulty: Difficulty) => setProgress((current) => ({ ...current, difficulty }));

  const resetProgress = () => {
    if (typeof window !== 'undefined' && !window.confirm('Reset all saved cases and notes in this browser?')) return;
    try { getBrowserStorage()?.removeItem(SAVE_KEY); } catch { /* Storage may be unavailable in private browsing. */ }
    setProgress(createFreshProgress());
    setActiveCaseId(null);
    setAccusationFeedback('');
    clearShareUrl();
  };

  const home = () => {
    goHome();
    clearShareUrl();
  };

  const solvedCount = Object.keys(progress.results).length;

  return (
    <div className={`app-frame ${activeCase ? `case-theme-${activeCase.id}` : 'bureau-theme'}`}>
      <div className="ambient-light ambient-one" aria-hidden="true" /><div className="ambient-light ambient-two" aria-hidden="true" />
      <GameHeader activeCaseTitle={activeCase?.title} solvedCount={solvedCount} saveAvailable={saveAvailable} soundEnabled={progress.soundEnabled} onToggleSound={() => setProgress((current) => ({ ...current, soundEnabled: !current.soundEnabled }))} onHome={home} onReset={!activeCase ? resetProgress : undefined} />
      <div className="app-content">
        {activeCase && activeProgress ? (
          <CaseWorkspace
            key={activeCase.id}
            caseFile={activeCase}
            progress={activeProgress}
            difficulty={progress.difficulty}
            feedback={accusationFeedback}
            onBack={home}
            onExamine={examineEvidence}
            onConnectEvidence={discoverConnection}
            onBoardOrderChange={updateBoardOrder}
            onInterview={logInterview}
            onNoteChange={(notes) => updateCase(activeCase.id, (caseProgress) => ({ ...caseProgress, notes }))}
            onHint={addHint}
            onAccuse={makeAccusation}
            onShare={() => void revealShare(activeProgress.result ?? undefined)}
          />
        ) : sharedResult && sharedCase ? (
          <ShareResultScreen
            caseFile={sharedCase}
            result={sharedResult}
            onOpenCase={() => openCase(sharedCase.id)}
            onCopy={() => void revealShare(sharedResult)}
            notice={shareNotice}
            onHome={home}
          />
        ) : (
          <HomeScreen progress={progress} onOpenCase={openCase} onSetDifficulty={setDifficulty} />
        )}
      </div>
      <footer className="global-footer"><span>© 2026 CipherCase</span></footer>
    </div>
  );
}
