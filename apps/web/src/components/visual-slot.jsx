export function healthVisualState(character) {
  if (!character || !character.hpMax) return 'unknown';
  if (character.hp <= 0) return 'down';
  const ratio = character.hp / character.hpMax;
  if (ratio <= 0.25) return 'critical';
  if (ratio <= 0.5) return 'wounded';
  return 'healthy';
}

const stateLabels = {
  healthy: 'saudável',
  wounded: 'ferido',
  critical: 'crítico',
  down: 'caído',
  unknown: 'estado não definido',
};

export default function VisualSlot({ slot, label, state, portrait = false, compact = false }) {
  return <aside
    className={`visual-slot ${portrait ? 'portrait-slot' : ''} ${compact ? 'visual-slot-compact' : ''}`}
    data-visual-slot={slot}
    data-health-state={state || undefined}
    aria-label={label}
  >
    <div className="visual-slot-frame" aria-hidden="true">
      <span className="visual-slot-rune">✦</span>
      <span className="visual-slot-corners">⌜ ⌝<br />⌞ ⌟</span>
    </div>
    <div className="visual-slot-copy">
      <strong>{label}</strong>
      <span>{state ? `Arte futura · estado ${stateLabels[state] ?? state}` : 'Arte futura · espaço reservado'}</span>
    </div>
  </aside>;
}