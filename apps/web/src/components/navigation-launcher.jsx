'use client';

const items = [
  ['sheet', 'Personagem', '◈'],
  ['npc', 'Campanha', '⌖'],
  ['math', 'Batalha', '⚔'],
  ['note', 'Diário de sessão', '≡'],
];

export default function NavigationLauncher({ group, screen, open, onToggle, onChoose }) {
  function active(key) {
    if (key === 'sheet') return group === 'personal';
    if (key === 'npc') return group === 'campaign';
    return screen === key;
  }

  return <div className={`nav-launcher ${open ? 'open' : ''}`}>
    <nav id="primary-navigation" className="nav-popover" aria-label="Navegação principal" aria-hidden={!open}>
      <div className="nav-popover-heading">
        <span className="brand-icon compact" aria-hidden="true">◈</span>
        <div><strong>ESCUDO RPG</strong><small>Seu lado da aventura</small></div>
      </div>
      <div className="nav-popover-items">
        {items.map(([key, label, icon]) => <button
          key={key}
          className={`nav-button ${active(key) ? 'active' : ''}`}
          onClick={() => { onChoose(key); onToggle(false); }}
          tabIndex={open ? 0 : -1}
        ><span aria-hidden="true">{icon}</span><span>{label}</span></button>)}
      </div>
    </nav>
    <button
      className="nav-trigger"
      aria-label={open ? 'Fechar navegação' : 'Abrir navegação'}
      aria-controls="primary-navigation"
      aria-expanded={open}
      onClick={() => onToggle(!open)}
    ><span aria-hidden="true">{open ? '×' : '◈'}</span><span className="nav-trigger-label">Menu</span></button>
  </div>;
}
