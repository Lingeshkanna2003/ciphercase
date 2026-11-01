interface EvidenceArtifactProps { icon: string; title: string }

export default function EvidenceArtifact({ icon, title }: EvidenceArtifactProps) {
  const kind = ['door', 'file', 'clock', 'key', 'footprints', 'fingerprint', 'ticket'].includes(icon) ? icon : 'file';
  return <div className={`evidence-artifact artifact-${kind}`} role="img" aria-label={`Illustration of ${title}`}>
    <span className="artifact-code">CC · EVIDENCE</span>
    <svg viewBox="0 0 180 100" fill="none" aria-hidden="true">
      {kind === 'clock' && <><circle cx="90" cy="51" r="34" fill="#ad8550" /><circle cx="90" cy="51" r="26" fill="#e4d6b8" stroke="#55452f" strokeWidth="2" /><circle cx="90" cy="51" r="2.8" fill="#3b352e" /><path d="M90 32v19l15 9" stroke="#44392e" strokeWidth="3" strokeLinecap="round" /><path d="M78 17h24l-4 7H82zM83 85h14" stroke="#d9b36e" strokeWidth="3" strokeLinecap="round" /></>}
      {kind === 'key' && <><circle cx="61" cy="49" r="22" fill="#d9b36e" /><circle cx="61" cy="49" r="11" fill="#151b25" /><path d="M79 49h54l10 10-8 8-8-8h-10v10h-12V57H79" fill="#c39752" stroke="#f2d797" strokeWidth="2" strokeLinejoin="round" /><path d="M49 28l-6-7m36 9 6-8" stroke="#ffdf99" strokeWidth="2" strokeLinecap="round" /></>}
      {kind === 'door' && <><path d="M50 16h62v70H50z" fill="#754c39" stroke="#deb879" strokeWidth="3" /><path d="M59 24h45v61H59z" fill="#293a39" stroke="#cba76c" strokeWidth="2" /><circle cx="95" cy="56" r="3" fill="#f0cb86" /><path d="M36 87h94" stroke="#a7c8a5" strokeWidth="3" strokeLinecap="round" /><path d="M130 21v64" stroke="#40e4e0" strokeOpacity=".36" strokeWidth="2" strokeDasharray="4 5" /></>}
      {kind === 'file' && <><path d="M48 16h52l22 22v50H48z" fill="#e6d9bc" stroke="#ad8b5a" strokeWidth="2" /><path d="M100 16v22h22" fill="#c8b38b" stroke="#ad8b5a" strokeWidth="2" /><path d="M61 50h48M61 59h38M61 68h43" stroke="#696158" strokeWidth="2" strokeLinecap="round" /><circle cx="108" cy="72" r="8" fill="#9f3d58" /><path d="M104 72h8m-4-4v8" stroke="#f5dcad" strokeWidth="1.5" /></>}
      {kind === 'ticket' && <><path d="M43 32h94v42a9 9 0 0 0 0 18H43a9 9 0 0 0 0-18z" fill="#e7d8b5" stroke="#c09b62" strokeWidth="2" /><path d="M70 35v54" stroke="#8b7556" strokeDasharray="3 4" strokeWidth="2" /><path d="M84 49h36m-36 10h27" stroke="#4f4d50" strokeWidth="2" strokeLinecap="round" /><text x="49" y="61" fill="#6c5a43" fontSize="12" fontFamily="Georgia">7</text></>}
      {kind === 'footprints' && <><path d="M67 29c-8-7-17 2-15 12 2 9 10 13 17 7 6-5 5-14-2-19zm38 22c-8-7-17 2-15 12 2 9 10 13 17 7 6-5 5-14-2-19z" fill="#9b624a" /><path d="M75 56c-8 2-10 12-5 20 5 7 14 7 18 0 4-7-3-22-13-20zm38 22c-8 2-10 12-5 20 5 7 14 7 18 0 4-7-3-22-13-20z" fill="#bc8562" /><path d="M39 86h101" stroke="#40e4e0" strokeOpacity=".46" strokeWidth="2" /></>}
      {kind === 'fingerprint' && <><path d="M90 18c-22 0-38 15-38 35m77-8c-3-17-19-27-39-27m-30 49c-3 9-4 18-7 24m30-45c0-8 5-13 13-13 9 0 14 6 14 14 0 22-8 36-11 46m-30-44c0-17 11-28 27-28s28 11 28 28c0 15-4 31-8 43m-37-20c-1 8-3 14-6 20m17-24c-1 9-3 17-6 24" stroke="#e3d4b5" strokeWidth="3" strokeLinecap="round" /><circle cx="90" cy="53" r="2" fill="#f4c977" /></>}
    </svg>
    <span className="artifact-title">{title}</span>
  </div>;
}
