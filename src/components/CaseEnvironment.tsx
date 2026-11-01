import clockworkGarden from '../assets/cases/clockwork-garden.jpg';
import lastPlatform from '../assets/cases/last-platform.jpg';
import blueHourScore from '../assets/cases/blue-hour-score.jpg';

interface CaseEnvironmentProps {
  caseId: string;
  compact?: boolean;
  eager?: boolean;
}

const scenes: Record<string, { name: string; image: string }> = {
  'clockwork-garden': {
    name: 'conservatory',
    image: clockworkGarden,
  },
  'last-platform': {
    name: 'station',
    image: lastPlatform,
  },
  'blue-hour-score': {
    name: 'concert',
    image: blueHourScore,
  },
};

export default function CaseEnvironment({ caseId, compact = false, eager = false }: CaseEnvironmentProps) {
  const scene = scenes[caseId] ?? scenes['clockwork-garden'];

  return (
    <span className={`case-environment environment-${scene.name} ${compact ? 'environment-compact' : ''}`} aria-hidden="true">
      <img
        className="case-environment-image"
        src={scene.image}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </span>
  );
}
