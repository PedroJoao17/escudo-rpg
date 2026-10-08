'use client';
import { useEffect, useState } from 'react';
import { abilityModifier, proficiencyBonus } from '@escudo/rules';
import { apiRequest } from '../lib/api';
import Modal from './modal';
import EntryEditor, { kindLabels } from './entry-editor';
import BattleHub from './battle-hub';
import NavigationLauncher from './navigation-launcher';
import CharacterEditor from './character-editor';

const attributes = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
const names = { ability: 'Habilidades', sheet: 'Ficha', item: 'Inventário', npc: 'NPCs', mechanic: 'Mecânicas', location: 'Locais', math: 'Batalha', note: 'Diário' };
const icons = { ability: '✧', sheet: '◈', item: '▣', npc: '♧', mechanic: '⚙', location: '⌖', math: '⚔', note: '≡' };
const personalTabs = ['ability', 'sheet', 'item'];
const campaignTabs = ['npc', 'mechanic', 'location'];
const profileNames = { homebrew: 'Regras da mesa', 'dnd5e-2014': 'D&D 5e · 2014', 'dnd5e-2024': 'D&D 5e · 2024' };
const relationNames = { 'located-at': 'Local', 'responsible-for': 'Responsável', uses: 'Mecânica / recurso', mentions: 'Referência' };

function signed(value) { return value >= 0 ? `+${value}` : String(value); }

export default function PlayerScreen() {
  const [campaigns, setCampaigns] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [characterId, setCharacterId] = useState('');
  const [mode, setMode] = useState('');
  const [screen, setScreen] = useState('sheet');
  const [wide, setWide] = useState(true);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      try {
        const list = await apiRequest('/campaigns');
        const initial = list.campaigns[0] ? await apiRequest(`/campaigns/${list.campaigns[0].id}/screen`) : null;
        if (active) { setCampaigns(list.campaigns); setMode(list.mode); setSnapshot(initial); setCharacterId(initial?.characters[0]?.id ?? ''); }
      } catch (e) { if (active) setLoadError(e.message); } finally { if (active) setLoading(false); }
    }
    initialLoad();
    return () => { active = false; };
  }, []);

  const character = snapshot?.characters.find((c) => c.id === characterId);
  const campaign = snapshot?.campaign;
  const base = campaign ? `/campaigns/${campaign.id}` : '';
  const entries = snapshot?.entries ?? [];
  const visibleEntries = (kind) => entries.filter((e) => e.kind === kind && (!e.characterId || e.characterId === characterId) && `${e.title} ${e.body} ${e.source}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  const group = personalTabs.includes(screen) ? 'personal' : campaignTabs.includes(screen) ? 'campaign' : screen;
  const tabs = group === 'personal' ? personalTabs : group === 'campaign' ? campaignTabs : [screen];
  const pending = entries.filter((e) => e.knowledge === 'needs-review').length;

  async function refresh(id = campaign?.id) {
    if (!id) return;
    const data = await apiRequest(`/campaigns/${id}/screen`);
    setSnapshot(data);
    setCharacterId((previous) => data.characters.some((c) => c.id === previous) ? previous : data.characters[0]?.id ?? '');
    return data;
  }
  async function selectCampaign(id) {
    setLoading(true); setLoadError(''); setQuery('');
    try { await refresh(id); } catch (e) { setLoadError(e.message); } finally { setLoading(false); }
  }
  async function mutate(path, values, method = 'POST', close = true) {
    setSaving(true); setNotice(null);
    try {
      const result = await apiRequest(path, { method, ...(values !== undefined ? { body: JSON.stringify(values) } : {}) });
      await refresh(); if (close) setModal(null);
      setNotice({ text: mode === 'demo' ? 'Atualizado nesta demonstração. As alterações são temporárias.' : 'Alteração salva no seu caderno.', error: false });
      return result;
    } catch (e) { setNotice({ text: e.message, error: true }); throw e; } finally { setSaving(false); }
  }
  async function exportCampaign() {
    try {
      const data = await apiRequest(`${base}/export`);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `escudo-${campaign.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`; anchor.click(); URL.revokeObjectURL(url);
    } catch (e) { setNotice({ text: e.message, error: true }); }
  }
  function choose(next) { setScreen(next); setQuery(''); }
  function add(kind) { setModal({ type: 'entry', kind }); }
  function linked(entry) {
    return (snapshot?.links ?? []).filter((l) => l.sourceId === entry.id || l.targetId === entry.id).map((l) => ({ ...l, entry: entries.find((e) => e.id === (l.sourceId === entry.id ? l.targetId : l.sourceId)) })).filter((l) => l.entry);
  }
  function openLinked(entry) { choose(entry.kind === 'companion' ? 'sheet' : entry.kind); setModal({ type: 'entry', kind: entry.kind, entry }); }

  function entryCard(entry) {
    const p = entry.payload;
    const locked = entry.kind === 'ability' && ((p.requiredLevel ?? 1) > (character?.level ?? 1) || p.learned === false);
    return <article className={`entry-card ${locked ? 'future-card' : ''}`} key={entry.id}>
      <div className="card-heading"><h3>{entry.title}</h3><button className="icon-button" disabled={saving} aria-label={`Editar ${entry.title}`} onClick={() => setModal({ type: 'entry', kind: entry.kind, entry })}>↗</button></div>
      <div className="tags">
        {entry.kind === 'ability' && <><span className="tag">Nível {p.requiredLevel ?? 1} {locked ? '· Futuro' : '· Disponível'}</span><span className="tag">{p.category ?? 'Habilidade'}</span></>}
        {entry.kind === 'npc' && <><span className="tag">{p.role || 'Pessoa conhecida'}</span>{p.unlocked && <span className="tag good">Confiança conquistada</span>}{p.trust && <span className="tag good">Confiança {p.trust}</span>}</>}
        {entry.kind === 'item' && <>{p.equipped && <span className="tag good">Equipado</span>}{p.reusable && <span className="tag">Reutilizável</span>}{p.container && (!p.equipped || p.container.toLowerCase() !== 'equipado') && <span className="tag">{p.container}</span>}{p.weight !== undefined && <span className="tag">{p.weight.toLocaleString('pt-BR')} kg</span>}</>}
        {entry.kind === 'location' && p.status && <span className="tag">{p.status}</span>}
        {entry.kind === 'note' && p.gameDay !== undefined && <span className="tag">Dia {p.gameDay}</span>}
        {entry.knowledge !== 'confirmed' && <span className="tag warning">{entry.knowledge === 'rumor' ? 'Rumor' : 'A confirmar'}</span>}
      </div>
      {entry.kind === 'ability' && <p className="small-info">{p.activation || 'Ativação a definir'}{p.cost ? ` · ${p.cost}` : ''}</p>}
      {entry.kind === 'mechanic' && <p className="small-info">{[p.trigger, p.cost, p.reset].filter(Boolean).join(' · ')}</p>}
      <details className="entry-description"><summary>Descrição e origem</summary><p className="preserve-text">{entry.body || 'Esta nota está vazia. Complete quando tiver informações.'}</p><p className="source">Fonte: {entry.source || 'Não informada'}</p>
        {!!p.missingLinks?.length && <p className="error-text">Referências ausentes: {p.missingLinks.join('; ')}</p>}
      </details>
      {linked(entry).length > 0 && <div className="linked">{linked(entry).map((l) => <button key={l.id} className="link-chip" title={relationNames[l.relation]} onClick={() => openLinked(l.entry)}>{icons[l.entry.kind] ?? '↔'} {l.entry.title}</button>)}</div>}
      <div className="card-footer">
        {entry.kind === 'item' ? <div className="quantity"><button disabled={saving || (p.quantity ?? 1) <= 0} aria-label={`Consumir uma unidade de ${entry.title}`} onClick={() => mutate(`${base}/entries/${entry.id}/quantity`, { delta: -1, expectedRevision: entry.revision }, 'POST', false).catch(() => {})}>−</button><strong aria-label={`Quantidade de ${entry.title}`}>{p.quantity ?? 1}</strong><button disabled={saving} aria-label={`Adicionar uma unidade de ${entry.title}`} onClick={() => mutate(`${base}/entries/${entry.id}/quantity`, { delta: 1, expectedRevision: entry.revision }, 'POST', false).catch(() => {})}>+</button></div> : <span className="muted small">{p.sessionDate ? new Date(`${p.sessionDate}T12:00:00`).toLocaleDateString('pt-BR') : 'Seu registro da campanha'}</span>}
        <div className="card-actions"><button className="text-button" onClick={() => setModal({ type: 'link', entry })}>Vincular</button><button className="text-button danger" onClick={() => setModal({ type: 'delete', entry })}>Excluir</button></div>
      </div>
    </article>;
  }

  function collection(kind, compact = false) {
    let list = visibleEntries(kind).sort((a, b) => kind === 'ability' ? (a.payload.requiredLevel ?? 1) - (b.payload.requiredLevel ?? 1) : kind === 'note' ? (b.payload.gameDay ?? 0) - (a.payload.gameDay ?? 0) : 0);
    if (compact && kind === 'ability') {
      const currentLevel = list.filter((e) => (e.payload.requiredLevel ?? 1) === character.level && e.payload.learned !== false);
      const available = list.filter((e) => (e.payload.requiredLevel ?? 1) <= character.level && e.payload.learned !== false);
      list = (currentLevel.length ? currentLevel : available.slice().reverse()).slice(0, 3);
    } else if (compact && kind === 'item') {
      list = [...list].sort((a, b) => Number(Boolean(b.payload.equipped)) - Number(Boolean(a.payload.equipped))).slice(-4).reverse();
    } else if (compact) list = list.slice(0, 3);
    const knownWeights = list.filter((e) => e.payload.weight !== undefined && e.payload.weight !== null && e.payload.weight !== '');
    const knownWeightTotal = knownWeights.reduce((sum, e) => sum + (e.payload.quantity ?? 1) * Number(e.payload.weight), 0);
    return <section className={`panel collection ${compact ? 'compact-panel' : ''}`}><div className="panel-title"><div><p className="eyebrow">{group === 'personal' ? 'Seu personagem' : 'Sua campanha'}</p><h2>{names[kind]}</h2></div><button className="add-button" aria-label={`Adicionar ${kindLabels[kind]}`} onClick={() => add(kind)}>+</button></div>
      {kind === 'item' && knownWeights.length > 0 && <p className="muted">Peso conhecido: {knownWeightTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg</p>}
      {kind === 'location' && !compact && <div className="map"><span className="map-label">Mapa esquemático · sem escala</span>{list.map((e) => <button key={e.id} className="map-pin" style={{ left: `${Math.max(12, Math.min(88, e.payload.x ?? 50))}%`, top: `${Math.max(18, Math.min(86, e.payload.y ?? 50))}%` }} onClick={() => setModal({ type: 'entry', kind, entry: e })}>⌖<span>{e.title}</span></button>)}</div>}
      <div className="card-list">{list.length ? list.map(entryCard) : <div className="empty"><span>{icons[kind]}</span><p>{query ? 'Nenhum registro corresponde à busca.' : `Seu escudo está pronto para receber ${names[kind].toLowerCase()}.`}</p><button className="secondary" onClick={() => add(kind)}>Adicionar {kindLabels[kind].toLowerCase()}</button></div>}</div>
      {compact && visibleEntries(kind).length > list.length && <button className="text-button compact-more" onClick={() => { setWide(false); choose(kind); }}>Ver todos os registros →</button>}
    </section>;
  }

  function sheet(compact = false) {
    return <section className={`panel character-panel ${compact ? 'compact-panel' : ''}`}><div className="panel-title"><div><p className="eyebrow">O centro do seu escudo</p><h2>Ficha</h2></div><button className="text-button" onClick={() => setModal({ type: 'character', character })}>Editar ficha</button></div>
      <div className="character-identity"><div className="character-emblem" aria-hidden="true"><svg viewBox="0 0 100 120"><path d="M50 4 90 22v43c0 22-20 42-40 52C30 107 10 87 10 65V22Z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m50 25 18 28-18 29-18-29Z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M50 16v78M26 53h48" fill="none" stroke="currentColor" strokeWidth="1" /></svg></div><div><h3 className="character-name">{character.name}</h3><p className="character-subtitle">{character.species} · {character.className}</p><p className="tag level-tag">Nível {character.level} · {character.background || 'Antecedente a definir'}</p></div></div>
      <div className="hp-area"><div className="hp-line"><span>Pontos de vida</span><strong>{character.hp}<small> / {character.hpMax}</small></strong></div><progress max={character.hpMax} value={character.hp} aria-label="Pontos de vida" /><div className="hp-actions"><button disabled={saving} onClick={() => mutate(`${base}/characters/${character.id}/hp`, { delta: -1, expectedRevision: character.revision }, 'POST', false).catch(() => {})}>−1 PV</button><span>{character.tempHp} PV temporários</span><button disabled={saving} onClick={() => mutate(`${base}/characters/${character.id}/hp`, { delta: 1, expectedRevision: character.revision }, 'POST', false).catch(() => {})}>+1 PV</button></div></div>
      <div className="quick-stats"><div><span>CA base</span><strong>{character.armorClass}</strong></div><div><span>Proficiência</span><strong>+{proficiencyBonus(character.level)}</strong></div><div><span>Deslocamento</span><strong>{character.speed.toLocaleString('pt-BR')} m</strong></div></div>
      <p className="muted small">CA registrada na ficha. Efeitos e estilos temporários devem ser conferidos na mesa.</p>
      <div className="attribute-grid">{Object.entries(attributes).map(([key, name]) => <div key={key}><span>{name}</span><strong>{signed(abilityModifier(character.attributes[key]))}</strong><small>{character.attributes[key]}</small></div>)}</div>
      {!compact && <><div className="sheet-details">{Object.entries(character.details).map(([label, value]) => <details key={label} open={/perícias|salvaguardas/i.test(label)}><summary>{label}</summary><p className="preserve-text">{value}</p></details>)}</div>
      {!!character.resources.length && <div className="resources"><h3>Recursos registrados</h3>{character.resources.map((r, i) => <p key={i}><span>{r.name}</span><strong>{r.current} / {r.max}</strong></p>)}<p className="muted small">Atualize na edição da ficha. Recuperação permanece manual.</p></div>}
      {visibleEntries('companion').map(entryCard)}<button className="text-button" onClick={() => add('companion')}>+ Registrar companheiro ou montaria</button></>}
      {compact && <button className="text-button compact-more" onClick={() => { setWide(false); choose('sheet'); }}>Abrir ficha completa →</button>}
    </section>;
  }

  async function saveCharacter(values) {
    const current = modal.character;
    try {
      const result = await mutate(current ? `${base}/characters/${current.id}` : `${base}/characters`, current ? { ...values, expectedRevision: current.revision } : values, current ? 'PATCH' : 'POST');
      setCharacterId(result.id);
    } catch { /* a mensagem permanece visível no escudo */ }
  }

  async function saveCombatPlan(plan, values) {
    const entry = {
      kind: 'note',
      characterId: character.id,
      title: values.title,
      body: values.body,
      source: 'Plano de combate do jogador',
      knowledge: 'confirmed',
      payload: values.payload,
    };
    return mutate(plan ? `${base}/entries/${plan.id}` : `${base}/entries`, plan ? { ...entry, expectedRevision: plan.revision } : entry, plan ? 'PATCH' : 'POST', false);
  }

  async function deleteCombatPlan(plan) {
    try { await mutate(`${base}/entries/${plan.id}?revision=${plan.revision}`, undefined, 'DELETE', false); } catch { /* a mensagem permanece visível no escudo */ }
  }

  return <div className="app-shell">
    <NavigationLauncher group={group} screen={screen} open={navOpen} onToggle={setNavOpen} onChoose={choose} />
    <main><header className="topbar"><div className="breadcrumb">Escudo RPG <span>/</span> {group === 'personal' ? 'Personagem' : group === 'campaign' ? 'Campanha' : names[screen]}</div><div className="topbar-actions"><button className="text-button" disabled={!campaign || saving} onClick={() => refresh().then(() => setNotice({ text: 'Informações atualizadas.', error: false })).catch((e) => setNotice({ text: e.message, error: true }))}>↻ Atualizar</button><button className="secondary" disabled={!campaign} onClick={exportCampaign}>Exportar caderno ↗</button></div></header>
      <div className="main-content"><section className="hero"><div><p className="eyebrow">CONCENTRE-SE NA AVENTURA</p><h1>Seu lado da aventura.</h1><p>Conheça seu personagem. Conecte as pistas. Guarde o que importa.</p></div><span className="hero-mark" aria-hidden="true">✦</span></section>
        {mode === 'demo' && <div className="demo-banner"><strong>Demonstração com dados fictícios.</strong> As alterações duram até encerrar esta demonstração.</div>}
        {notice && <div className={`notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.text}<button className="icon-button" aria-label="Fechar aviso" onClick={() => setNotice(null)}>×</button></div>}
        <section className="context-bar"><label>Campanha<select aria-label="Campanha" value={campaign?.id ?? ''} onChange={(e) => selectCampaign(e.target.value)} disabled={saving || loading}>{!campaign && <option value="">Selecione uma campanha</option>}{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="text-button" onClick={() => setModal({ type: 'campaign' })}>+ Nova campanha</button>
          <div className="context-divider" />{campaign && <><label>Personagem<select aria-label="Personagem" value={characterId} onChange={(e) => setCharacterId(e.target.value)} disabled={saving}>{!character && <option value="">Sem personagem</option>}{snapshot.characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="text-button" onClick={() => setModal({ type: 'character' })}>+ Novo personagem</button><span className="tag context-tag">{profileNames[campaign.rulesProfile]} · Dia {campaign.gameDay}</span></>}
        </section>
        {loading ? <div className="panel loading" role="status">Abrindo seu caderno…</div> : loadError ? <div className="panel empty" role="alert"><h2>Não foi possível abrir o escudo</h2><p>{loadError}</p><button className="primary" onClick={() => window.location.reload()}>Tentar novamente</button></div> : !campaign ? <div className="panel empty"><h2>A primeira página da aventura</h2><p>Crie uma campanha e seu personagem para começar.</p><button className="primary" onClick={() => setModal({ type: 'campaign' })}>Criar campanha</button></div> : !character ? <div className="panel empty"><h2>Quem vive esta aventura?</h2><p>Crie a primeira ficha deste caderno.</p><button className="primary" onClick={() => setModal({ type: 'character' })}>Criar personagem</button></div> : <>
          <div className="screen-toolbar">{(!wide || !['personal', 'campaign'].includes(group)) && <div role="tablist" aria-label="Telas do escudo" className="tabs">{tabs.map((key) => <button role="tab" aria-selected={screen === key} key={key} className={screen === key ? 'selected' : ''} onClick={() => choose(key)}><span aria-hidden="true">{icons[key]}</span>{names[key]}</button>)}</div>}
            <div className="toolbar-tools">{screen !== 'math' && <label className="search"><span aria-hidden="true">⌕</span><input aria-label="Buscar nesta tela" placeholder="Buscar nesta tela…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>}{['personal', 'campaign'].includes(group) && <button className={`secondary view-toggle ${wide ? 'toggled' : ''}`} aria-pressed={wide} onClick={() => setWide(!wide)}><span aria-hidden="true">◌</span> {wide ? 'Escudo aberto' : 'Tela única'}</button>}</div>
          </div>
          {pending > 0 && <p className="pending-line">◌ {pending} {pending === 1 ? 'informação precisa' : 'informações precisam'} de confirmação. Seus registros mantêm a origem visível.</p>}
          {screen === 'math' ? <BattleHub character={character} entries={entries} busy={saving} onOpenEntry={(entry) => setModal({ type: 'entry', kind: entry.kind, entry })} onSavePlan={saveCombatPlan} onDeletePlan={deleteCombatPlan} /> : screen === 'note' ? <div className="single-screen">{collection('note')}</div> : <div className={`screen-grid ${wide ? 'wide-view' : 'single-view'}`}>{(wide ? tabs : [screen]).map((key) => <div key={key} className={`screen-pane ${key === screen ? 'focused-pane' : ''}`}>{key === 'sheet' ? sheet(wide) : collection(key, wide)}</div>)}</div>}
        </>}
        <footer className="page-footer">ESCUDO RPG <span>Informações do jogador, na perspectiva do jogador.</span></footer>
      </div>
    </main>
    {modal && <Modal size={modal.type === 'character' ? 'wide' : 'default'} title={modal.type === 'entry' ? `${modal.entry ? 'Editar' : 'Novo registro de'} ${kindLabels[modal.kind].toLowerCase()}` : modal.type === 'character' ? modal.character ? 'Editar ficha' : 'Novo personagem' : modal.type === 'campaign' ? 'Nova campanha' : modal.type === 'link' ? `Vincular ${modal.entry.title}` : 'Excluir registro'} onClose={() => { if (!saving) setModal(null); }}>
      {notice?.error && <p className="error-text" role="alert">{notice.text}</p>}
      {modal.type === 'entry' && <EntryEditor entry={modal.entry} kind={modal.kind} characterId={characterId} gameDay={campaign.gameDay} busy={saving} onSave={(values) => mutate(modal.entry ? `${base}/entries/${modal.entry.id}` : `${base}/entries`, modal.entry ? { ...values, expectedRevision: modal.entry.revision } : values, modal.entry ? 'PATCH' : 'POST')} />}
      {modal.type === 'character' && <CharacterEditor character={modal.character} busy={saving} onSave={saveCharacter} />}
      {modal.type === 'campaign' && <form className="form-stack" onSubmit={async (e) => { e.preventDefault(); const data = new FormData(e.currentTarget); setSaving(true); try { const created = await apiRequest('/campaigns', { method: 'POST', body: JSON.stringify({ name: data.get('name'), description: data.get('description'), rulesProfile: data.get('rulesProfile'), gameDay: Number(data.get('gameDay')) }) }); setCampaigns((list) => [...list, created]); await refresh(created.id); setModal(null); } catch (err) { setNotice({ text: err.message, error: true }); } finally { setSaving(false); } }}><label>Nome da campanha<input autoFocus name="name" required maxLength="200" /></label><label>Descrição<textarea name="description" rows="4" /></label><div className="form-grid"><label>Base de regras<select name="rulesProfile" defaultValue="homebrew">{Object.entries(profileNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Dia da campanha<input name="gameDay" type="number" min="0" defaultValue="1" required /></label></div><p className="muted">O perfil identifica a referência da mesa. Habilidades e exceções são registradas por você.</p><button className="primary" disabled={saving}>Criar campanha</button></form>}
      {modal.type === 'link' && <form className="form-stack" onSubmit={async (e) => { e.preventDefault(); const data = new FormData(e.currentTarget); try { await mutate(`${base}/links`, { sourceId: modal.entry.id, targetId: data.get('targetId'), relation: data.get('relation') }); } catch { /* mensagem no escudo */ } }}><label>Relacionar com<select name="targetId" required><option value="">Selecione um registro</option>{entries.filter((e) => e.id !== modal.entry.id).map((e) => <option key={e.id} value={e.id}>{kindLabels[e.kind]} · {e.title}</option>)}</select></label><label>Relação<select name="relation">{Object.entries(relationNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="primary" disabled={saving}>Salvar vínculo</button></form>}
      {modal.type === 'delete' && <div className="form-stack"><p>Excluir “{modal.entry.title}” e seus vínculos deste caderno?</p><button className="primary danger-button" disabled={saving} onClick={() => mutate(`${base}/entries/${modal.entry.id}?revision=${modal.entry.revision}`, undefined, 'DELETE').catch(() => {})}>Excluir registro</button><button className="secondary" onClick={() => setModal(null)}>Voltar</button></div>}
    </Modal>}
  </div>;
}
