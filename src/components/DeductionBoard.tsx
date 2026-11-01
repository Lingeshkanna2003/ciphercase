import { ArrowDown, ArrowUp, Check, CircleHelp, Link2, Pin, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CaseConnection, Evidence, Suspect } from '../types/game';

interface DeductionBoardProps {
  evidence: Evidence[];
  suspects: Suspect[];
  connections: CaseConnection[];
  discoveredConnectionIds: string[];
  order: string[];
  onConnect: (id: string) => void;
  onOrderChange: (ids: string[]) => void;
}

export default function DeductionBoard({ evidence, suspects, connections, discoveredConnectionIds, order, onConnect, onOrderChange }: DeductionBoardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState('Select two clues, or one clue and a suspect, to compare their details.');
  const orderedEvidence = useMemo(() => {
    const orderIndex = new Map(order.map((id, index) => [id, index]));
    return [...evidence].sort((a, b) => (orderIndex.get(a.id) ?? evidence.length) - (orderIndex.get(b.id) ?? evidence.length));
  }, [evidence, order]);
  const discovered = new Set(discoveredConnectionIds);

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
    setMessage('Choose two clues, or one clue and a suspect, then compare.');
  };

  const compare = () => {
    if (selectedIds.length !== 2) return;
    const suspectToken = selectedIds.find((id) => id.startsWith('suspect:'));
    const evidenceIds = selectedIds.filter((id) => !id.startsWith('suspect:'));
    const suspectId = suspectToken?.slice('suspect:'.length);
    const connection = connections.find((item) => suspectId
      ? item.suspectId === suspectId && item.evidenceIds.length === 1 && item.evidenceIds[0] === evidenceIds[0]
      : item.evidenceIds.length === 2 && item.evidenceIds.every((id) => evidenceIds.includes(id)));
    if (connection) {
      if (!discovered.has(connection.id)) onConnect(connection.id);
      setMessage(connection.insight);
    } else {
      setMessage('No clear link yet. Revisit the times, places, and details on each clue.');
    }
  };

  const move = (id: string, delta: -1 | 1) => {
    const ids = orderedEvidence.map((item) => item.id);
    const index = ids.indexOf(id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    onOrderChange(ids);
  };

  return (
    <section className="deduction-board" aria-labelledby="board-title">
      <div className="deduction-board-heading">
        <div><p className="eyebrow"><span className="eyebrow-line" /> Connect the evidence</p><h3 id="board-title">The deduction board</h3></div>
        <span className="board-pin-count"><Pin size={14} /> {discovered.size} connection{discovered.size === 1 ? '' : 's'} found</span>
      </div>
      <p className="board-instructions">Compare two clues, or pair a clue with a suspect. Rearrange pinned evidence with the arrow controls.</p>
      {orderedEvidence.length === 0 ? <div className="board-empty"><CircleHelp size={17} /> Examine evidence to add your first pin.</div> : <>
        <div className="board-canvas" aria-label="Collected clues on the deduction board">
          {orderedEvidence.map((item, index) => {
            const selected = selectedIds.includes(item.id);
            const linked = connections.some((connection) => discovered.has(connection.id) && connection.evidenceIds.includes(item.id));
            return <article className={`board-clue ${selected ? 'board-clue-selected' : ''} ${linked ? 'board-clue-linked' : ''}`} key={item.id}>
              <button type="button" className="board-clue-select" aria-pressed={selected} onClick={() => toggleSelection(item.id)}>
                <span className="board-clue-pin"><Pin size={13} /></span><span className="board-clue-kind">{item.kind} · {String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><span className="board-clue-location">{item.location}</span>
              </button>
              <span className="board-clue-actions"><button type="button" aria-label={`Move ${item.title} earlier`} disabled={index === 0} onClick={() => move(item.id, -1)}><ArrowUp size={13} /></button><button type="button" aria-label={`Move ${item.title} later`} disabled={index === orderedEvidence.length - 1} onClick={() => move(item.id, 1)}><ArrowDown size={13} /></button></span>
            </article>;
          })}
          {orderedEvidence.length % 2 === 1 && <div className="board-next-clue"><span><CircleHelp size={17} /></span><strong>Room for another lead</strong><small>Examine another item to add it to the board.</small></div>}
        </div>
        <div className="board-suspects" aria-label="Suspects to compare with evidence"><span className="board-suspects-label">People of interest</span>{suspects.map((suspect) => { const token = `suspect:${suspect.id}`; const selected = selectedIds.includes(token); const linked = connections.some((connection) => discovered.has(connection.id) && connection.suspectId === suspect.id); return <button type="button" key={suspect.id} className={`board-suspect ${selected ? 'board-suspect-selected' : ''} ${linked ? 'board-suspect-linked' : ''}`} aria-pressed={selected} onClick={() => toggleSelection(token)}><span>{suspect.initials}</span><strong>{suspect.name}</strong><small>{suspect.role}</small></button>; })}</div>
        <div className="board-compare-row"><div className="board-selection" aria-live="polite"><span>{selectedIds.length ? selectedIds.map((id) => id.startsWith('suspect:') ? suspects.find((person) => person.id === id.slice('suspect:'.length))?.name : evidence.find((item) => item.id === id)?.title).join(' + ') : 'Two clues make a theory'}</span><p>{message}</p></div><button type="button" className="board-compare-button" disabled={selectedIds.length !== 2} onClick={compare}><Link2 size={15} /> Compare</button></div>
        {discovered.size > 0 && <ol className="board-connections" aria-label="Discovered connections">{connections.filter((item) => discovered.has(item.id)).map((connection) => <li key={connection.id}><span><Check size={13} /></span><div><strong>{[...connection.evidenceIds.map((id) => evidence.find((item) => item.id === id)?.title), ...(connection.suspectId ? [suspects.find((person) => person.id === connection.suspectId)?.name] : [])].filter(Boolean).join(' + ')}</strong><p>{connection.insight}</p></div></li>)}</ol>}
        <button type="button" className="board-clear-selection" onClick={() => { setSelectedIds([]); setMessage('Select two clues, or one clue and a suspect, to compare their details.'); }}><RotateCcw size={12} /> Clear selection</button>
      </>}
    </section>
  );
}
