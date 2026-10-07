'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { abilityModifier, proficiencyBonus } from '@escudo/rules';
import { apiRequest } from '../lib/api';
import Modal from './modal';
import EntryEditor, { kindLabels } from './entry-editor';
import Calculator from './calculator';

const attributes = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
const names = { ability: 'Habilidades', sheet: 'Ficha', item: 'Inventário', npc: 'NPCs', mechanic: 'Mecânicas', location: 'Locais', math: 'Calculadora', note: 'Diário' };
const icons = { ability: '✧', sheet: '◈', item: '▣', npc: '♧', mechanic: '⚙', location: '⌖', math: '◇', note: '≡' };
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
        {entry.kind === 'npc' && <><span className="tag">{p.role || 'Pessoa conhecida'}</span>{p.unlocked && <span className="tag good">Confiança conquistada</span>}</>}
        {entry.kind === 'item' && <>{p.equipped && <span className="tag good">Equipado</span>}{p.reusable && <span className="tag">Reutilizável</span>}{p.container && (!p.equipped || p.container.toLowerCase() !== 'equipado') && <span className="tag">{p.container}</span>}</>}
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
  function collection(kind) {
    const list = visibleEntries(kind).sort((a, b) => kind === 'ability' ? (a.payload.requiredLevel ?? 1) - (b.payload.requiredLevel ?? 1) : kind === 'note' ? (b.payload.gameDay ?? 0) - (a.payload.gameDay ?? 0) : 0);
    return <section className="panel collection"><div className="panel-title"><div><p className="eyebrow">{group === 'personal' ? 'Seu personagem' : 'Sua campanha'}</p><h2>{names[kind]}</h2></div><button className="add-button" aria-label={`Adicionar ${kindLabels[kind]}`} onClick={() => add(kind)}>+</button></div>
      {kind === 'item' && <p className="muted">Peso conhecido: {list.reduce((sum, e) => sum + (e.payload.quantity ?? 1) * (e.payload.weight ?? 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg</p>}
      {kind === 'location' && <div className="map"><span className="map-label">Mapa esquemático · sem escala</span>{list.map((e) => <button key={e.id} className="map-pin" style={{ left: `${Math.max(12, Math.min(88, e.payload.x ?? 50))}%`, top: `${Math.max(18, Math.min(86, e.payload.y ?? 50))}%` }} onClick={() => setModal({ type: 'entry', kind, entry: e })}>⌖<span>{e.title}</span></button>)}</div>}
      <div className="card-list">{list.length ? list.map(entryCard) : <div className="empty"><span>{icons[kind]}</span><p>{query ? 'Nenhum registro corresponde à busca.' : `Seu escudo está pronto para receber ${names[kind].toLowerCase()}.`}</p><button className="secondary" onClick={() => add(kind)}>Adicionar {kindLabels[kind].toLowerCase()}</button></div>}</div>
    </section>;
  }
  function sheet() {
    return <section className="panel character-panel"><div className="panel-title"><div><p className="eyebrow">O centro do seu escudo</p><h2>Ficha</h2></div><button className="text-button" onClick={() => setModal({ type: 'character', character })}>Editar ficha</button></div>
      <div className="character-emblem" aria-hidden="true"><svg viewBox="0 0 100 120"><path d="M50 4 90 22v43c0 22-20 42-40 52C30 107 10 87 10 65V22Z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m50 25 18 28-18 29-18-29Z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M50 16v78M26 53h48" fill="none" stroke="currentColor" strokeWidth="1" /></svg></div>
      <h3 className="character-name">{character.name}</h3><p className="character-subtitle">{character.species} · {character.className}</p><p className="tag level-tag">Nível {character.level} · {character.background || 'Antecedente a definir'}</p>
      <div className="hp-area"><div className="hp-line"><span>Pontos de vida</span><strong>{character.hp}<small> / {character.hpMax}</small></strong></div><progress max={character.hpMax} value={character.hp} aria-label="Pontos de vida" /><div className="hp-actions"><button disabled={saving} onClick={() => mutate(`${base}/characters/${character.id}/hp`, { delta: -1, expectedRevision: character.revision }, 'POST', false).catch(() => {})}>−1 PV</button><span>{character.tempHp} PV temporários</span><button disabled={saving} onClick={() => mutate(`${base}/characters/${character.id}/hp`, { delta: 1, expectedRevision: character.revision }, 'POST', false).catch(() => {})}>+1 PV</button></div></div>
      <div className="quick-stats"><div><span>CA base</span><strong>{character.armorClass}</strong></div><div><span>Proficiência</span><strong>+{proficiencyBonus(character.level)}</strong></div><div><span>Deslocamento</span><strong>{character.speed.toLocaleString('pt-BR')} m</strong></div></div>
      <p className="muted small">CA registrada na ficha. Efeitos e estilos temporários devem ser conferidos na mesa.</p>
      <div className="attribute-grid">{Object.entries(attributes).map(([key, name]) => <div key={key}><span>{name}</span><strong>{signed(abilityModifier(character.attributes[key]))}</strong><small>{character.attributes[key]}</small></div>)}</div>
      <div className="sheet-details">{Object.entries(character.details).map(([label, value]) => <details key={label}><summary>{label}</summary><p className="preserve-text">{value}</p></details>)}</div>
      {!!character.resources.length && <div className="resources"><h3>Recursos registrados</h3>{character.resources.map((r, i) => <p key={i}><span>{r.name}</span><strong>{r.current} / {r.max}</strong></p>)}<p className="muted small">Atualize na edição da ficha. Recuperação permanece manual.</p></div>}
      {visibleEntries('companion').map(entryCard)}<button className="text-button" onClick={() => add('companion')}>+ Registrar companheiro ou montaria</button>
    </section>;
  }

  async function saveCharacter(event) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const current = modal.character;
    const details = { ...(current?.details ?? {}) };
    Object.keys(details).forEach((key, index) => { details[key] = data.get(`detail-${index}`); });
    if (data.get('newSection')?.trim()) details[data.get('newSection').trim()] = data.get('newContent');
    const resources = (current?.resources ?? []).map((r, index) => ({ ...r, current: Number(data.get(`resource-${index}`)) }));
    const values = { name: data.get('name'), className: data.get('className'), species: data.get('species'), background: data.get('background'), level: Number(data.get('level')), hp: Number(data.get('hp')), hpMax: Number(data.get('hpMax')), tempHp: Number(data.get('tempHp')), armorClass: Number(data.get('armorClass')), speed: Number(data.get('speed')), attributes: Object.fromEntries(Object.keys(attributes).map((key) => [key, Number(data.get(key))])), details, resources };
    try { const result = await mutate(current ? `${base}/characters/${current.id}` : `${base}/characters`, current ? { ...values, expectedRevision: current.revision } : values, current ? 'PATCH' : 'POST'); setCharacterId(result.id); } catch { /* mensagem exibida no escudo */ }
  }

  return <div className="app-shell">
    <aside className="sidebar"><Link href="/" className="brand"><span className="brand-icon">◈</span><span>ESCUDO<span className="brand-small">RPG</span></span></Link><p className="sidebar-caption">SEU LADO DA AVENTURA</p>
      <nav aria-label="Navegação principal"><p className="nav-label">Seu escudo</p>{[['sheet', 'Personagem', '◈'], ['npc', 'Campanha', '⌖'], ['math', 'Calculadora', '◇'], ['note', 'Diário de sessão', '≡']].map(([key, label, icon]) => <button key={key} className={`nav-button ${(key === 'sheet' ? group === 'personal' : key === 'npc' ? group === 'campaign' : screen === key) ? 'active' : ''}`} onClick={() => choose(key)}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav>
      <div className="sidebar-bottom"><span className="online-dot" /><p>Um caderno pessoal.<br /><strong>Uma aventura por vez.</strong></p></div>
    </aside>
    <main><header className="topbar"><div className="breadcrumb">Escudo RPG <span>/</span> {group === 'personal' ? 'Personagem' : group === 'campaign' ? 'Campanha' : names[screen]}</div><div className="topbar-actions"><button className="text-button" disabled={!campaign || saving} onClick={() => refresh().then(() => setNotice({ text: 'Informações atualizadas.', error: false })).catch((e) => setNotice({ text: e.message, error: true }))}>↻ Atualizar</button><button className="secondary" disabled={!campaign} onClick={exportCampaign}>Exportar caderno ↗</button></div></header>
      <div className="main-content"><section className="hero"><div><p className="eyebrow">CONCENTRE-SE NA AVENTURA</p><h1>Seu lado da aventura.</h1><p>Conheça seu personagem. Conecte as pistas. Guarde o que importa.</p></div><span className="hero-mark" aria-hidden="true">✦</span></section>
        {mode === 'demo' && <div className="demo-banner"><strong>Demonstração com dados fictícios.</strong> As alterações duram até encerrar esta demonstração.</div>}
        {notice && <div className={`notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.text}<button className="icon-button" aria-label="Fechar aviso" onClick={() => setNotice(null)}>×</button></div>}
        <section className="context-bar"><label>Campanha<select aria-label="Campanha" value={campaign?.id ?? ''} onChange={(e) => selectCampaign(e.target.value)} disabled={saving || loading}>{!campaign && <option value="">Selecione uma campanha</option>}{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="text-button" onClick={() => setModal({ type: 'campaign' })}>+ Nova campanha</button>
          <div className="context-divider" />{campaign && <><label>Personagem<select aria-label="Personagem" value={characterId} onChange={(e) => setCharacterId(e.target.value)} disabled={saving}>{!character && <option value="">Sem personagem</option>}{snapshot.characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="text-button" onClick={() => setModal({ type: 'character' })}>+ Novo personagem</button><span className="tag context-tag">{profileNames[campaign.rulesProfile]} · Dia {campaign.gameDay}</span></>}
        </section>
        {loading ? <div className="panel loading" role="status">Abrindo seu caderno…</div> : loadError ? <div className="panel empty" role="alert"><h2>Não foi possível abrir o escudo</h2><p>{loadError}</p><button className="primary" onClick={() => window.location.reload()}>Tentar novamente</button></div> : !campaign ? <div className="panel empty"><h2>A primeira página da aventura</h2><p>Crie uma campanha e seu personagem para começar.</p><button className="primary" onClick={() => setModal({ type: 'campaign' })}>Criar campanha</button></div> : !character ? <div className="panel empty"><h2>Quem vive esta aventura?</h2><p>Crie a primeira ficha deste caderno.</p><button className="primary" onClick={() => setModal({ type: 'character' })}>Criar personagem</button></div> : <>
          <div className="screen-toolbar"><div role="tablist" aria-label="Telas do escudo" className="tabs">{tabs.map((key) => <button role="tab" aria-selected={screen === key} key={key} className={screen === key ? 'selected' : ''} onClick={() => choose(key)}><span aria-hidden="true">{icons[key]}</span>{names[key]}</button>)}</div>
            <div className="toolbar-tools">{screen !== 'math' && <label className="search"><span aria-hidden="true">⌕</span><input aria-label="Buscar nesta tela" placeholder="Buscar nesta tela…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>}{['personal', 'campaign'].includes(group) && <button className={`secondary view-toggle ${wide ? 'toggled' : ''}`} aria-pressed={wide} onClick={() => setWide(!wide)}>{wide ? '▥ Escudo aberto' : '▣ Tela única'}</button>}</div>
          </div>
          {pending > 0 && <p className="pending-line">◌ {pending} {pending === 1 ? 'informação precisa' : 'informações precisam'} de confirmação. Seus registros mantêm a origem visível.</p>}
          {screen === 'math' ? <Calculator key={characterId} character={character} /> : screen === 'note' ? <div className="single-screen">{collection('note')}</div> : <div className={`screen-grid ${wide ? 'wide-view' : 'single-view'}`}>{(wide ? tabs : [screen]).map((key) => <div key={key} className={`screen-pane ${key === screen ? 'focused-pane' : ''}`}>{key === 'sheet' ? sheet() : collection(key)}</div>)}</div>}
        </>}
        <footer className="page-footer">ESCUDO RPG <span>Informações do jogador, na perspectiva do jogador.</span></footer>
      </div>
    </main>
    {modal && <Modal title={modal.type === 'entry' ? `${modal.entry ? 'Editar' : 'Novo registro de'} ${kindLabels[modal.kind].toLowerCase()}` : modal.type === 'character' ? modal.character ? 'Editar ficha' : 'Novo personagem' : modal.type === 'campaign' ? 'Nova campanha' : modal.type === 'link' ? `Vincular ${modal.entry.title}` : 'Excluir registro'} onClose={() => { if (!saving) setModal(null); }}>
      {notice?.error && <p className="error-text" role="alert">{notice.text}</p>}
      {modal.type === 'entry' && <EntryEditor entry={modal.entry} kind={modal.kind} characterId={characterId} gameDay={campaign.gameDay} busy={saving} onSave={(values) => mutate(modal.entry ? `${base}/entries/${modal.entry.id}` : `${base}/entries`, modal.entry ? { ...values, expectedRevision: modal.entry.revision } : values, modal.entry ? 'PATCH' : 'POST')} />}
      {modal.type === 'character' && <form className="form-stack" onSubmit={saveCharacter}><label>Nome<input autoFocus name="name" required maxLength="200" defaultValue={modal.character?.name ?? ''} /></label><div className="form-grid">{[['className', 'Classe'], ['species', 'Raça / espécie'], ['background', 'Antecedente']].map(([key, label]) => <label key={key}>{label}<input name={key} maxLength="200" defaultValue={modal.character?.[key] ?? ''} /></label>)}<label>Nível<input name="level" type="number" min="1" max="20" defaultValue={modal.character?.level ?? 1} required /></label></div><div className="form-grid">{[['hp', 'PV atual', 0, 10], ['hpMax', 'PV máximo', 1, 10], ['tempHp', 'PV temporário', 0, 0], ['armorClass', 'CA base', 0, 10], ['speed', 'Deslocamento em metros', 0, 9]].map(([key, label, min, fallback]) => <label key={key}>{label}<input name={key} type="number" min={min} max={key === 'armorClass' ? 100 : 10000} step={key === 'speed' ? '0.1' : '1'} required defaultValue={modal.character?.[key] ?? fallback} /></label>)}</div><div className="form-grid">{Object.entries(attributes).map(([key, label]) => <label key={key}>{label}<input name={key} type="number" min="1" max="30" required defaultValue={modal.character?.attributes[key] ?? 10} /></label>)}</div>{Object.entries(modal.character?.details ?? {}).map(([key, value], i) => <label key={key}>{key}<textarea name={`detail-${i}`} rows="3" defaultValue={value} /></label>)}{modal.character?.resources.map((r, i) => <label key={i}>{r.name} (máximo {r.max})<input name={`resource-${i}`} type="number" min="0" max={r.max} defaultValue={r.current} /></label>)}<label>Nova seção da ficha<input name="newSection" maxLength="100" placeholder="Ex.: perícias, personalidade, magias, moedas" /></label><label>Conteúdo da nova seção<textarea name="newContent" rows="4" /></label><button className="primary" disabled={saving}>Salvar ficha</button></form>}
      {modal.type === 'campaign' && <form className="form-stack" onSubmit={async (e) => { e.preventDefault(); const data = new FormData(e.currentTarget); setSaving(true); try { const created = await apiRequest('/campaigns', { method: 'POST', body: JSON.stringify({ name: data.get('name'), description: data.get('description'), rulesProfile: data.get('rulesProfile'), gameDay: Number(data.get('gameDay')) }) }); setCampaigns((list) => [...list, created]); await refresh(created.id); setModal(null); } catch (err) { setNotice({ text: err.message, error: true }); } finally { setSaving(false); } }}><label>Nome da campanha<input autoFocus name="name" required maxLength="200" /></label><label>Descrição<textarea name="description" rows="4" /></label><div className="form-grid"><label>Base de regras<select name="rulesProfile" defaultValue="homebrew">{Object.entries(profileNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Dia da campanha<input name="gameDay" type="number" min="0" defaultValue="1" required /></label></div><p className="muted">O perfil identifica a referência da mesa. Habilidades e exceções são registradas por você.</p><button className="primary" disabled={saving}>Criar campanha</button></form>}
      {modal.type === 'link' && <form className="form-stack" onSubmit={async (e) => { e.preventDefault(); const data = new FormData(e.currentTarget); try { await mutate(`${base}/links`, { sourceId: modal.entry.id, targetId: data.get('targetId'), relation: data.get('relation') }); } catch { /* mensagem no escudo */ } }}><label>Relacionar com<select name="targetId" required><option value="">Selecione um registro</option>{entries.filter((e) => e.id !== modal.entry.id).map((e) => <option key={e.id} value={e.id}>{kindLabels[e.kind]} · {e.title}</option>)}</select></label><label>Relação<select name="relation">{Object.entries(relationNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="primary" disabled={saving}>Salvar vínculo</button></form>}
      {modal.type === 'delete' && <div className="form-stack"><p>Excluir “{modal.entry.title}” e seus vínculos deste caderno?</p><button className="primary danger-button" disabled={saving} onClick={() => mutate(`${base}/entries/${modal.entry.id}?revision=${modal.entry.revision}`, undefined, 'DELETE').catch(() => {})}>Excluir registro</button><button className="secondary" onClick={() => setModal(null)}>Voltar</button></div>}
    </Modal>}
  </div>;
}
