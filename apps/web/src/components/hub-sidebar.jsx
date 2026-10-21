'use client';

const hubs = [
  { id: 'general', label: 'Infos gerais', icon: '◈', help: 'Ficha de consulta' },
  { id: 'campaign', label: 'Campanha', icon: '⌖', help: 'Mundo e objetivos' },
  { id: 'inventory', label: 'Inventário', icon: '▣', help: 'Objetos e moedas' },
  { id: 'arsenal', label: 'Arsenal', icon: '⚔', help: 'Equipamento e técnicas' },
  { id: 'combat', label: 'Combate', icon: '✦', help: 'Turno e estratégias' },
];

export default function HubSidebar({ activeHub, open, campaign, character, pending = 0, onChoose, onClose }) {
  function choose(hub) {
    onChoose(hub);
    onClose?.();
  }

  return <>
    <button
      type="button"
      className={`hub-sidebar-backdrop ${open ? 'visible' : ''}`}
      aria-label="Fechar menu principal"
      tabIndex={open ? 0 : -1}
      onClick={onClose}
    />
    <aside className={`hub-sidebar ${open ? 'open' : ''}`} aria-label="Navegação principal">
      <div className="hub-brand">
        <span className="hub-brand-mark" aria-hidden="true">✦</span>
        <div><strong>Escudo RPG</strong><small>Seu lado da aventura</small></div>
        <button type="button" className="hub-sidebar-close" aria-label="Fechar menu principal" onClick={onClose}>×</button>
      </div>

      <div className="hub-character-chip">
        <span className="hub-character-avatar" aria-hidden="true">◈</span>
        <div>
          <strong>{character?.name ?? 'Sem personagem'}</strong>
          <small>{character ? `${character.className || 'Classe a definir'} · Nv. ${character.level}` : campaign?.name ?? 'Abra um caderno'}</small>
        </div>
      </div>

      <nav className="hub-nav-list" aria-label="Hubs do escudo">
        {hubs.map((hub) => <button
          key={hub.id}
          type="button"
          className={`hub-nav-item ${activeHub === hub.id ? 'active' : ''}`}
          aria-current={activeHub === hub.id ? 'page' : undefined}
          onClick={() => choose(hub.id)}
        >
          <span className="hub-nav-icon" aria-hidden="true">{hub.icon}</span>
          <span className="hub-nav-copy"><strong>{hub.label}</strong><small>{hub.help}</small></span>
        </button>)}
      </nav>

      <div className="hub-sidebar-foot">
        {pending > 0 && <span className="hub-pending"><i aria-hidden="true">◌</i>{pending} {pending === 1 ? 'pendência' : 'pendências'} de regra</span>}
        <p>Consulta rápida, anotações conectadas e decisões de combate em um único caderno.</p>
      </div>
    </aside>
  </>;
}
