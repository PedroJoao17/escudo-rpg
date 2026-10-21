'use client';

import { useEffect, useMemo, useState } from 'react';
import { abilityModifier, proficiencyBonus } from '@escudo/rules';
import { apiRequest } from '../lib/api';
import Modal from './modal';
import EntryEditor, { kindLabels } from './entry-editor';
import BattleHub from './battle-hub';
import CharacterEditor from './character-editor';
import HubSidebar from './hub-sidebar';
import VisualSlot, { healthVisualState } from './visual-slot';

const attributes = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
const profileNames = { homebrew: 'Regras da mesa', 'dnd5e-2014': 'D&D 5e · 2014', 'dnd5e-2024': 'D&D 5e · 2024' };
const relationNames = { 'located-at': 'Local', 'responsible-for': 'Responsável', uses: 'Mecânica / recurso', mentions: 'Referência' };
const hubNames = { general: 'Infos gerais', campaign: 'Campanha', inventory: 'Inventário', arsenal: 'Arsenal', combat: 'Combate' };
const itemTypeNames = { general: 'Objeto', currency: 'Moeda', consumable: 'Consumível', tool: 'Ferramenta', weapon: 'Arma', armor: 'Armadura', ammo: 'Munição', narrative: 'Objeto narrativo' };
const signed = (value) => value >= 0 ? `+${value}` : String(value);

function isLegacyArsenalItem(entry) {
  const text = `${entry.title} ${entry.body} ${entry.payload?.container ?? ''}`.toLocaleLowerCase('pt-BR');
  return /arma|arco|espada|flecha|muni|escudo|armadura|adaga|machado|lança|besta/.test(text);
}

function itemBucket(entry) {
  const type = entry.payload?.itemType;
  if (['weapon', 'armor', 'ammo'].includes(type)) return 'arsenal';
  if (type) return 'inventory';
  return isLegacyArsenalItem(entry) ? 'arsenal' : 'inventory';
}

function objectiveNote(entry) {
  return entry.kind === 'note' && /objetiv|miss[aã]o/i.test(entry.payload?.section ?? '');
}

function combatPlan(entry) {
  return entry.kind === 'note' && entry.payload?.combatPlan === true;
}

export default function PlayerScreen() {
  const [campaigns, setCampaigns] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [characterId, setCharacterId] = useState('');
  const [mode, setMode] = useState('');
  const [hub, setHub] = useState('general');
  const [campaignSection, setCampaignSection] = useState('story');
  const [arsenalSection, setArsenalSection] = useState('equipment');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      try {
        const list = await apiRequest('/campaigns');
        const initial = list.campaigns[0] ? await apiRequest(`/campaigns/${list.campaigns[0].id}/screen`) : null;
        if (active) {
          setCampaigns(list.campaigns);
          setMode(list.mode);
          setSnapshot(initial);
          setCharacterId(initial?.characters[0]?.id ?? '');
        }
      } catch (error) {
        if (active) setLoadError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    initialLoad();
    return () => { active = false; };
  }, []);

  const character = snapshot?.characters.find((candidate) => candidate.id === characterId);
  const campaign = snapshot?.campaign;
  const base = campaign ? `/campaigns/${campaign.id}` : '';
  const entries = snapshot?.entries ?? [];
  const pending = entries.filter((entry) => entry.knowledge === 'needs-review').length;
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');

  const filteredEntries = useMemo(() => {
    if (!normalizedQuery) return entries;
    return entries.filter((entry) => `${entry.title} ${entry.body} ${entry.source} ${entry.payload?.section ?? ''} ${entry.payload?.role ?? ''}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery));
  }, [entries, normalizedQuery]);

  async function refresh(id = campaign?.id) {
    if (!id) return;
    const data = await apiRequest(`/campaigns/${id}/screen`);
    setSnapshot(data);
    setCharacterId((previous) => data.characters.some((candidate) => candidate.id === previous) ? previous : data.characters[0]?.id ?? '');
    return data;
  }

  async function selectCampaign(id) {
    setLoading(true); setLoadError(''); setQuery('');
    try { await refresh(id); } catch (error) { setLoadError(error.message); } finally { setLoading(false); }
  }

  async function mutate(path, values, method = 'POST', close = true, refreshAfter = true) {
    setSaving(true); setNotice(null);
    try {
      const result = await apiRequest(path, { method, ...(values !== undefined ? { body: JSON.stringify(values) } : {}) });
      if (refreshAfter) await refresh();
      if (close) setModal(null);
      setNotice({ text: mode === 'demo' ? 'Atualizado nesta demonstração. As alterações são temporárias.' : 'Alteração salva no seu caderno.', error: false });
      return result;
    } catch (error) {
      setNotice({ text: error.message, error: true });
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function exportCampaign() {
    try {
      const data = await apiRequest(`${base}/export`);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `escudo-${campaign.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) { setNotice({ text: error.message, error: true }); }
  }

  function chooseHub(nextHub) {
    setHub(nextHub);
    setQuery('');
  }

  function add(kind, initialPayload = {}) {
    setModal({ type: 'entry', kind, initialPayload });
  }

  function linked(entry) {
    return (snapshot?.links ?? [])
      .filter((link) => link.sourceId === entry.id || link.targetId === entry.id)
      .map((link) => ({ ...link, entry: entries.find((candidate) => candidate.id === (link.sourceId === entry.id ? link.targetId : link.sourceId)) }))
      .filter((link) => link.entry);
  }

  function openLinked(entry) {
    if (entry.kind === 'item') chooseHub(itemBucket(entry));
    else if (['ability', 'companion'].includes(entry.kind)) chooseHub('arsenal');
    else chooseHub('campaign');
    setModal({ type: 'entry', kind: entry.kind, entry });
  }

  async function saveCharacter(values) {
    const current = modal.character;
    try {
      const result = await mutate(current ? `${base}/characters/${current.id}` : `${base}/characters`, current ? { ...values, expectedRevision: current.revision } : values, current ? 'PATCH' : 'POST');
      setCharacterId(result.id);
    } catch { /* aviso principal permanece visível */ }
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
    try { await mutate(`${base}/entries/${plan.id}?revision=${plan.revision}`, undefined, 'DELETE', false); } catch { /* aviso principal permanece visível */ }
  }

  async function adjustHp(delta) {
    try { await mutate(`${base}/characters/${character.id}/hp`, { delta, expectedRevision: character.revision }, 'POST', false); } catch { /* aviso principal permanece visível */ }
  }

  async function adjustItem(entry, delta) {
    try { await mutate(`${base}/entries/${entry.id}/quantity`, { delta, expectedRevision: entry.revision }, 'POST', false); } catch { /* aviso principal permanece visível */ }
  }

  async function transferLoot(items) {
    setSaving(true); setNotice(null);
    try {
      for (const item of items) {
        await apiRequest(`${base}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            kind: 'item',
            characterId: character.id,
            title: item.title,
            body: 'Transferido do saque temporário do Hub de Combate.',
            source: 'Saque de combate',
            knowledge: 'confirmed',
            payload: { quantity: item.quantity, itemType: item.itemType, equipped: false, reusable: item.itemType === 'tool' },
          }),
        });
      }
      await refresh();
      setNotice({ text: `${items.length} ${items.length === 1 ? 'item transferido' : 'itens transferidos'} para o caderno.`, error: false });
    } catch (error) {
      setNotice({ text: error.message, error: true });
      throw error;
    } finally { setSaving(false); }
  }

  function entryCard(entry, options = {}) {
    const payload = entry.payload ?? {};
    const abilityLocked = entry.kind === 'ability' && ((payload.requiredLevel ?? 1) > (character?.level ?? 1) || payload.learned === false);
    return <article className={`entry-card hub-entry-card ${abilityLocked ? 'future-card' : ''}`} key={entry.id}>
      <div className="card-heading">
        <div><h3>{entry.title}</h3>{options.subtitle && <p className="card-kicker">{options.subtitle}</p>}</div>
        <button className="icon-button" disabled={saving} aria-label={`Editar ${entry.title}`} onClick={() => setModal({ type: 'entry', kind: entry.kind, entry })}>↗</button>
      </div>
      <div className="tags">
        {entry.kind === 'ability' && <><span className="tag">Nível {payload.requiredLevel ?? 1} {abilityLocked ? '· Futuro' : '· Disponível'}</span><span className="tag">{payload.category ?? 'Habilidade'}</span>{payload.activation && <span className="tag">{payload.activation}</span>}</>}
        {entry.kind === 'item' && <><span className="tag">{itemTypeNames[payload.itemType] ?? 'Item'}</span>{payload.equipped && <span className="tag good">Equipado</span>}{payload.reusable && <span className="tag">Reutilizável</span>}{payload.container && <span className="tag">{payload.container}</span>}</>}
        {entry.kind === 'npc' && <><span className="tag">{payload.role || 'Pessoa conhecida'}</span>{payload.trust && <span className="tag good">Confiança {payload.trust}</span>}{payload.availability && <span className="tag">{payload.availability}</span>}</>}
        {entry.kind === 'companion' && <><span className="tag">{payload.role || 'Companheiro'}</span>{payload.availability && <span className="tag">{payload.availability}</span>}</>}
        {entry.kind === 'location' && payload.status && <span className="tag">{payload.status}</span>}
        {entry.kind === 'note' && payload.gameDay !== undefined && <span className="tag">Dia {payload.gameDay}</span>}
        {objectiveNote(entry) && <span className={`tag ${payload.objectiveStatus === 'completed' ? 'good' : ''}`}>{payload.objectiveStatus === 'completed' ? 'Concluído' : payload.objectiveStatus === 'paused' ? 'Pausado' : 'Aberto'}</span>}
        {entry.knowledge !== 'confirmed' && <span className="tag warning">{entry.knowledge === 'rumor' ? 'Rumor' : 'A confirmar'}</span>}
      </div>
      {entry.kind === 'item' && (payload.damage || payload.range || payload.properties || payload.effect) && <div className="item-combat-line">{[payload.damage, payload.range, payload.properties, payload.effect].filter(Boolean).map((value) => <span key={value}>{value}</span>)}</div>}
      {entry.kind === 'ability' && <p className="small-info">{[payload.activation || 'Ativação a definir', payload.cost, payload.duration].filter(Boolean).join(' · ')}</p>}
      {entry.kind === 'mechanic' && <p className="small-info">{[payload.trigger, payload.cost, payload.reset].filter(Boolean).join(' · ')}</p>}
      {entry.kind === 'companion' && (payload.hp !== null && payload.hp !== undefined) && <p className="small-info">PV conhecido: {payload.hp}{payload.hpMax ? ` / ${payload.hpMax}` : ''}{payload.command ? ` · ${payload.command}` : ''}</p>}
      <details className="entry-description"><summary>Descrição e origem</summary><p className="preserve-text">{entry.body || 'Esta nota está vazia. Complete quando tiver informações.'}</p><p className="source">Fonte: {entry.source || 'Não informada'}</p>{!!payload.missingLinks?.length && <p className="error-text">Referências ausentes: {payload.missingLinks.join('; ')}</p>}</details>
      {linked(entry).length > 0 && <div className="linked">{linked(entry).map((link) => <button key={link.id} className="link-chip" title={relationNames[link.relation]} onClick={() => openLinked(link.entry)}>↔ {link.entry.title}</button>)}</div>}
      <div className="card-footer">
        {entry.kind === 'item' ? <div className="quantity"><button disabled={saving || (payload.quantity ?? 1) <= 0} aria-label={`Consumir uma unidade de ${entry.title}`} onClick={() => adjustItem(entry, -1)}>−</button><strong aria-label={`Quantidade de ${entry.title}`}>{payload.quantity ?? 1}</strong><button disabled={saving} aria-label={`Adicionar uma unidade de ${entry.title}`} onClick={() => adjustItem(entry, 1)}>+</button></div> : <span className="muted small">{payload.sessionDate ? new Date(`${payload.sessionDate}T12:00:00`).toLocaleDateString('pt-BR') : 'Registro do seu caderno'}</span>}
        <div className="card-actions"><button className="text-button" onClick={() => setModal({ type: 'link', entry })}>Vincular</button><button className="text-button danger" onClick={() => setModal({ type: 'delete', entry })}>Excluir</button></div>
      </div>
    </article>;
  }

  function emptyState(title, copy, actionLabel, onAction) {
    return <div className="hub-empty"><span aria-hidden="true">✦</span><h3>{title}</h3><p>{copy}</p>{onAction && <button className="secondary" onClick={onAction}>{actionLabel}</button>}</div>;
  }

  function GeneralHub() {
    const state = healthVisualState(character);
    const details = character.details ?? {};
    const skills = details['Perícias'] || details['Perícias e salvaguardas'];
    const saves = details['Salvaguardas'] || details['Perícias e salvaguardas'];
    const interpretation = [['Ideal', details['Ideal']], ['Vínculos', details['Vínculos']], ['Defeitos', details['Defeitos']], ['História', details['História']]].filter(([, value]) => value);
    return <section className="hub-page hub-enter general-hub">
      <header className="hub-page-heading"><div><p className="eyebrow">CONSULTA · SEM EDIÇÃO NESTA TELA</p><h1>{character.name}</h1><p>{character.species || 'Espécie a definir'} · {character.className || 'Classe a definir'} · Nível {character.level}</p></div><span className="hub-level-badge">{character.background || 'Antecedente a definir'}</span></header>
      <div className="general-hero-grid">
        <VisualSlot slot="character-portrait" label="Retrato do personagem" state={state} portrait />
        <article className="panel general-vitals"><div className="vitals-row"><div><span>PV</span><strong>{character.hp}<small> / {character.hpMax}</small></strong></div><div><span>PV temporário</span><strong>{character.tempHp}</strong></div><div><span>CA</span><strong>{character.armorClass}</strong></div><div><span>Deslocamento</span><strong>{character.speed.toLocaleString('pt-BR')} m</strong></div><div><span>Proficiência</span><strong>+{proficiencyBonus(character.level)}</strong></div></div><progress max={character.hpMax} value={character.hp} aria-label="Pontos de vida" /><p className="muted small">O retrato acima já reserva os quatro estados visuais por PV. As artes serão adicionadas em etapa própria.</p></article>
      </div>
      <div className="general-content-grid">
        <article className="panel general-attributes"><div className="panel-title"><div><p className="eyebrow">BASE DO PERSONAGEM</p><h2>Atributos</h2></div></div><div className="attribute-grid">{Object.entries(attributes).map(([key, label]) => <div key={key}><span>{label}</span><strong>{signed(abilityModifier(character.attributes[key]))}</strong><small>{character.attributes[key]}</small></div>)}</div></article>
        <article className="panel general-proficiencies"><div className="panel-title"><div><p className="eyebrow">CONSULTA RÁPIDA</p><h2>Perícias e salvaguardas</h2></div></div><div className="read-only-detail"><strong>Perícias</strong><p>{skills || 'Nenhuma perícia estruturada ainda.'}</p></div><div className="read-only-detail"><strong>Salvaguardas</strong><p>{saves || 'Nenhuma salvaguarda estruturada ainda.'}</p></div>{details['Especializações'] && <div className="read-only-detail"><strong>Especializações</strong><p>{details['Especializações']}</p></div>}</article>
        <article className="panel general-profile"><div className="panel-title"><div><p className="eyebrow">INTERPRETAÇÃO</p><h2>Personalidade e história</h2></div></div>{interpretation.length ? interpretation.map(([label, value]) => <div className="read-only-detail" key={label}><strong>{label}</strong><p className="preserve-text">{value}</p></div>) : <p className="muted">Nenhuma informação de interpretação registrada.</p>}</article>
        <article className="panel general-knowledge"><div className="panel-title"><div><p className="eyebrow">CONHECIMENTOS</p><h2>Idiomas, proficiências e recursos</h2></div></div>{details['Idiomas'] && <div className="read-only-detail"><strong>Idiomas</strong><p>{details['Idiomas']}</p></div>}{details['Proficiências'] && <div className="read-only-detail"><strong>Proficiências</strong><p className="preserve-text">{details['Proficiências']}</p></div>}<div className="general-resource-list">{character.resources?.length ? character.resources.map((resource) => <div key={resource.name}><span>{resource.name}</span><strong>{resource.current} / {resource.max}</strong></div>) : <p className="muted">Nenhum recurso estruturado.</p>}</div></article>
      </div>
    </section>;
  }

  function CampaignHub() {
    const notes = filteredEntries.filter((entry) => entry.kind === 'note' && !objectiveNote(entry) && !combatPlan(entry));
    const npcs = filteredEntries.filter((entry) => entry.kind === 'npc');
    const locations = filteredEntries.filter((entry) => entry.kind === 'location');
    const mechanics = filteredEntries.filter((entry) => entry.kind === 'mechanic');
    const objectives = filteredEntries.filter(objectiveNote);
    const sections = [
      ['story', 'Enredo e notas', notes.length], ['npcs', 'NPCs', npcs.length], ['locations', 'Locais', locations.length], ['mechanics', 'Mecânicas', mechanics.length], ['objectives', 'Objetivos', objectives.length],
    ];
    let content;
    if (campaignSection === 'story') content = notes.length ? <div className="hub-card-grid">{notes.map((entry) => entryCard(entry))}</div> : emptyState('Nenhuma nota de sessão', 'Registre acontecimentos sem precisar classificá-los imediatamente.', 'Adicionar anotação', () => add('note', { gameDay: campaign.gameDay, section: 'Sessão' }));
    if (campaignSection === 'npcs') content = npcs.length ? <div className="hub-card-grid">{npcs.map((entry) => entryCard(entry))}</div> : emptyState('Nenhum NPC registrado', 'Cadastre apenas pessoas que o personagem conhece.', 'Adicionar NPC', () => add('npc'));
    if (campaignSection === 'locations') content = <><div className="campaign-map panel"><span className="map-label">Mapa esquemático · sem escala</span>{locations.map((entry) => <button key={entry.id} className="map-pin" style={{ left: `${Math.max(12, Math.min(88, entry.payload?.x ?? 50))}%`, top: `${Math.max(18, Math.min(86, entry.payload?.y ?? 50))}%` }} onClick={() => setModal({ type: 'entry', kind: 'location', entry })}>⌖<span>{entry.title}</span></button>)}</div>{locations.length ? <div className="hub-card-grid">{locations.map((entry) => entryCard(entry))}</div> : emptyState('Nenhum local conhecido', 'Locais entram aqui conforme forem descobertos pelo jogador.', 'Adicionar local', () => add('location'))}</>;
    if (campaignSection === 'mechanics') content = mechanics.length ? <div className="hub-card-grid">{mechanics.map((entry) => entryCard(entry))}</div> : emptyState('Nenhuma mecânica registrada', 'Serviços, regras locais e mecânicas conhecidas podem ser consultadas aqui.', 'Adicionar mecânica', () => add('mechanic'));
    if (campaignSection === 'objectives') content = objectives.length ? <div className="hub-card-grid">{objectives.map((entry) => entryCard(entry))}</div> : emptyState('Nenhum objetivo registrado', 'Use objetivos para missões, promessas e pendências da campanha.', 'Adicionar objetivo', () => add('note', { gameDay: campaign.gameDay, section: 'Objetivo', objectiveStatus: 'open' }));
    return <section className="hub-page hub-enter campaign-hub">
      <header className="hub-page-heading with-visual"><div><p className="eyebrow">SEU CADERNO DA CAMPANHA</p><h1>{campaign.name}</h1><p>{campaign.description || 'Sem descrição registrada.'}</p></div><VisualSlot slot="campaign-banner" label="Arte / mapa da campanha" compact /></header>
      <nav className="hub-subnav" aria-label="Seções da campanha">{sections.map(([id, label, count]) => <button key={id} className={campaignSection === id ? 'active' : ''} onClick={() => setCampaignSection(id)}>{label}<span>{count}</span></button>)}</nav>
      <div className="hub-section-head"><div><h2>{sections.find(([id]) => id === campaignSection)?.[1]}</h2><p>Dia conhecido da campanha: {campaign.gameDay} · {profileNames[campaign.rulesProfile]}</p></div><button className="primary" onClick={() => campaignSection === 'npcs' ? add('npc') : campaignSection === 'locations' ? add('location') : campaignSection === 'mechanics' ? add('mechanic') : add('note', { gameDay: campaign.gameDay, section: campaignSection === 'objectives' ? 'Objetivo' : 'Sessão', objectiveStatus: 'open' })}>+ Adicionar</button></div>
      {content}
    </section>;
  }

  function InventoryHub() {
    const items = filteredEntries.filter((entry) => entry.kind === 'item' && (!entry.characterId || entry.characterId === character.id) && itemBucket(entry) === 'inventory');
    const currencies = items.filter((entry) => entry.payload?.itemType === 'currency');
    const regularItems = items.filter((entry) => entry.payload?.itemType !== 'currency');
    const knownWeights = regularItems.filter((entry) => entry.payload?.weight !== undefined && entry.payload?.weight !== null && entry.payload?.weight !== '');
    const knownWeightTotal = knownWeights.reduce((sum, entry) => sum + (entry.payload?.quantity ?? 1) * Number(entry.payload.weight), 0);
    return <section className="hub-page hub-enter inventory-hub">
      <header className="hub-page-heading with-visual"><div><p className="eyebrow">O QUE VOCÊ CARREGA</p><h1>Inventário</h1><p>Objetos, consumíveis, ferramentas, chaves e moedas. Equipamento de combate fica separado no Arsenal.</p></div><VisualSlot slot="inventory-banner" label="Arte do inventário" compact /></header>
      <div className="hub-stat-strip"><div><span>Registros</span><strong>{items.length}</strong></div><div><span>Unidades</span><strong>{items.reduce((sum, entry) => sum + Number(entry.payload?.quantity ?? 1), 0)}</strong></div><div><span>Peso conhecido</span><strong>{knownWeights.length ? `${knownWeightTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg` : '—'}</strong></div><div><span>Moedas / valores</span><strong>{currencies.length}</strong></div></div>
      <div className="hub-section-head"><div><h2>Objetos e suprimentos</h2><p>Quantidade nunca fica negativa; peso ausente não é tratado como zero informado.</p></div><div className="hub-actions"><button className="secondary" onClick={() => add('item', { itemType: 'currency', quantity: 0 })}>+ Moeda</button><button className="primary" onClick={() => add('item', { itemType: 'general', quantity: 1 })}>+ Item</button></div></div>
      {regularItems.length ? <div className="hub-card-grid inventory-grid">{regularItems.map((entry) => entryCard(entry))}</div> : emptyState('Inventário vazio', 'Registre itens que precisam permanecer à mão durante a sessão.', 'Adicionar item', () => add('item', { itemType: 'general', quantity: 1 }))}
      {currencies.length > 0 && <section className="inventory-currency-section"><div className="hub-section-head"><div><h2>Moedas e valores</h2><p>Representação simples até a futura modelagem de carteira/histórico.</p></div></div><div className="hub-card-grid compact-grid">{currencies.map((entry) => entryCard(entry))}</div></section>}
    </section>;
  }

  function ArsenalHub() {
    const equipment = filteredEntries.filter((entry) => entry.kind === 'item' && (!entry.characterId || entry.characterId === character.id) && itemBucket(entry) === 'arsenal');
    const abilities = filteredEntries.filter((entry) => entry.kind === 'ability' && (!entry.characterId || entry.characterId === character.id));
    const companions = filteredEntries.filter((entry) => entry.kind === 'companion' && (!entry.characterId || entry.characterId === character.id));
    const learned = abilities.filter((entry) => entry.payload?.learned !== false && (entry.payload?.requiredLevel ?? 1) <= character.level);
    const sections = [['equipment', 'Equipamentos', equipment.length], ['abilities', 'Técnicas e passivas', abilities.length], ['allies', 'Aliados', companions.length]];
    return <section className="hub-page hub-enter arsenal-hub">
      <header className="hub-page-heading with-visual"><div><p className="eyebrow">PREPARE-SE ANTES DA LUTA</p><h1>Arsenal</h1><p>Armas, armaduras, munição, técnicas, passivas e companheiros ficam disponíveis ao Hub de Combate sem duplicação.</p></div><VisualSlot slot="arsenal-banner" label="Arte do arsenal" compact /></header>
      <nav className="hub-subnav" aria-label="Seções do arsenal">{sections.map(([id, label, count]) => <button key={id} className={arsenalSection === id ? 'active' : ''} onClick={() => setArsenalSection(id)}>{label}<span>{count}</span></button>)}</nav>
      {arsenalSection === 'equipment' && <><div className="hub-section-head"><div><h2>Armas, armaduras e munição</h2><p>Cadastros antigos são classificados por compatibilidade; novos itens usam tipo explícito.</p></div><button className="primary" onClick={() => add('item', { itemType: 'weapon', quantity: 1 })}>+ Equipamento</button></div>{equipment.length ? <div className="hub-card-grid">{equipment.map((entry) => entryCard(entry))}</div> : emptyState('Arsenal sem equipamentos', 'Cadastre armas e munição para usá-las nos planos de combate.', 'Adicionar arma', () => add('item', { itemType: 'weapon', quantity: 1 }))}</>}
      {arsenalSection === 'abilities' && <><div className="hub-section-head"><div><h2>Técnicas, habilidades e passivas</h2><p>{learned.length} disponíveis no nível atual · futuras permanecem visíveis e diferenciadas.</p></div><button className="primary" onClick={() => add('ability', { category: 'Técnica', requiredLevel: character.level, learned: true })}>+ Técnica</button></div>{abilities.length ? <div className="hub-card-grid">{abilities.sort((a, b) => (a.payload?.requiredLevel ?? 1) - (b.payload?.requiredLevel ?? 1)).map((entry) => entryCard(entry))}</div> : emptyState('Nenhuma técnica registrada', 'Cadastre passivas e técnicas preservando ação, custo e origem.', 'Adicionar técnica', () => add('ability', { category: 'Técnica', requiredLevel: character.level, learned: true }))}</>}
      {arsenalSection === 'allies' && <><div className="hub-section-head"><div><h2>Companheiros e aliados</h2><p>Mini ficha, comando conhecido e disponibilidade para a sessão.</p></div><button className="primary" onClick={() => add('companion', { availability: 'available' })}>+ Aliado</button></div>{companions.length ? <div className="hub-card-grid">{companions.map((entry) => entryCard(entry))}</div> : emptyState('Nenhum aliado cadastrado', 'Companheiros ficam prontos para seleção no Hub de Combate.', 'Adicionar companheiro', () => add('companion', { availability: 'available' }))}</>}
    </section>;
  }

  function ActiveHub() {
    if (hub === 'general') return <GeneralHub />;
    if (hub === 'campaign') return <CampaignHub />;
    if (hub === 'inventory') return <InventoryHub />;
    if (hub === 'arsenal') return <ArsenalHub />;
    return <section className="hub-page combat-page"><header className="hub-page-heading"><div><p className="eyebrow">DECISÃO RÁPIDA DURANTE A SESSÃO</p><h1>Combate</h1><p>PV, recursos, condições, planos, munição, aliados e saque temporário em um único fluxo.</p></div></header><BattleHub character={character} entries={entries} busy={saving} onOpenEntry={(entry) => setModal({ type: 'entry', kind: entry.kind, entry })} onSavePlan={saveCombatPlan} onDeletePlan={deleteCombatPlan} onAdjustHp={adjustHp} onAdjustItem={adjustItem} onTransferLoot={transferLoot} /></section>;
  }

  return <div className="hub-app">
    <HubSidebar activeHub={hub} open={mobileNavOpen} campaign={campaign} character={character} pending={pending} onChoose={chooseHub} onClose={() => setMobileNavOpen(false)} />
    <main className="hub-main">
      <header className="hub-topbar">
        <button className="hub-menu-button" aria-label="Abrir menu principal" onClick={() => setMobileNavOpen(true)}>☰</button>
        <div className="hub-topbar-title"><span>Escudo RPG</span><strong>{hubNames[hub]}</strong></div>
        <div className="hub-context-selectors">
          <label><span>Campanha</span><select aria-label="Campanha" value={campaign?.id ?? ''} onChange={(event) => selectCampaign(event.target.value)} disabled={saving || loading}>{!campaign && <option value="">Selecione</option>}{campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          {campaign && <label><span>Personagem</span><select aria-label="Personagem" value={characterId} onChange={(event) => setCharacterId(event.target.value)} disabled={saving}>{!character && <option value="">Sem personagem</option>}{snapshot.characters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        </div>
        <div className="hub-topbar-actions">
          {character && <button className="text-button" onClick={() => setModal({ type: 'character', character })}>Editar ficha</button>}
          <button className="text-button" disabled={!campaign || saving} onClick={() => refresh().then(() => setNotice({ text: 'Informações atualizadas.', error: false })).catch((error) => setNotice({ text: error.message, error: true }))}>↻ Atualizar</button>
          <button className="secondary" disabled={!campaign} onClick={exportCampaign}>Exportar</button>
        </div>
      </header>

      <div className="hub-content-shell">
        {mode === 'demo' && <div className="demo-banner"><strong>Demonstração com dados fictícios.</strong> As alterações duram até encerrar esta demonstração.</div>}
        {notice && <div className={`notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.text}<button className="icon-button" aria-label="Fechar aviso" onClick={() => setNotice(null)}>×</button></div>}
        {pending > 0 && <div className="hub-pending-banner">◌ {pending} {pending === 1 ? 'informação precisa' : 'informações precisam'} de confirmação. A origem permanece visível.</div>}
        {['campaign', 'inventory', 'arsenal'].includes(hub) && character && <label className="hub-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar neste hub" placeholder={`Buscar em ${hubNames[hub].toLowerCase()}…`} value={query} onChange={(event) => setQuery(event.target.value)} /></label>}

        {loading ? <div className="panel loading" role="status">Abrindo seu caderno…</div> : loadError ? <div className="panel empty" role="alert"><h2>Não foi possível abrir o escudo</h2><p>{loadError}</p><button className="primary" onClick={() => window.location.reload()}>Tentar novamente</button></div> : !campaign ? <div className="panel empty"><h2>A primeira página da aventura</h2><p>Crie uma campanha e seu personagem para começar.</p><button className="primary" onClick={() => setModal({ type: 'campaign' })}>Criar campanha</button></div> : !character ? <div className="panel empty"><h2>Quem vive esta aventura?</h2><p>Crie a primeira ficha deste caderno.</p><button className="primary" onClick={() => setModal({ type: 'character' })}>Criar personagem</button></div> : <ActiveHub />}

        <footer className="page-footer">ESCUDO RPG <span>Informações do jogador, na perspectiva do jogador.</span></footer>
      </div>
    </main>

    {modal && <Modal size={modal.type === 'character' ? 'wide' : 'default'} title={modal.type === 'entry' ? `${modal.entry ? 'Editar' : 'Novo registro de'} ${kindLabels[modal.kind].toLowerCase()}` : modal.type === 'character' ? modal.character ? 'Editar ficha' : 'Novo personagem' : modal.type === 'campaign' ? 'Nova campanha' : modal.type === 'link' ? `Vincular ${modal.entry.title}` : 'Excluir registro'} onClose={() => { if (!saving) setModal(null); }}>
      {notice?.error && <p className="error-text" role="alert">{notice.text}</p>}
      {modal.type === 'entry' && <EntryEditor entry={modal.entry} kind={modal.kind} characterId={characterId} gameDay={campaign.gameDay} busy={saving} initialPayload={modal.initialPayload} onSave={(values) => mutate(modal.entry ? `${base}/entries/${modal.entry.id}` : `${base}/entries`, modal.entry ? { ...values, expectedRevision: modal.entry.revision } : values, modal.entry ? 'PATCH' : 'POST')} />}
      {modal.type === 'character' && <CharacterEditor character={modal.character} busy={saving} onSave={saveCharacter} />}
      {modal.type === 'campaign' && <form className="form-stack" onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); setSaving(true); try { const created = await apiRequest('/campaigns', { method: 'POST', body: JSON.stringify({ name: data.get('name'), description: data.get('description'), rulesProfile: data.get('rulesProfile'), gameDay: Number(data.get('gameDay')) }) }); setCampaigns((list) => [...list, created]); await refresh(created.id); setModal(null); } catch (error) { setNotice({ text: error.message, error: true }); } finally { setSaving(false); } }}><label>Nome da campanha<input autoFocus name="name" required maxLength="200" /></label><label>Descrição<textarea name="description" rows="4" /></label><div className="form-grid"><label>Base de regras<select name="rulesProfile" defaultValue="homebrew">{Object.entries(profileNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Dia da campanha<input name="gameDay" type="number" min="0" defaultValue="1" required /></label></div><p className="muted">O perfil identifica a referência da mesa. Habilidades e exceções são registradas por você.</p><button className="primary" disabled={saving}>Criar campanha</button></form>}
      {modal.type === 'link' && <form className="form-stack" onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); try { await mutate(`${base}/links`, { sourceId: modal.entry.id, targetId: data.get('targetId'), relation: data.get('relation') }); } catch { /* aviso principal permanece visível */ } }}><label>Relacionar com<select name="targetId" required><option value="">Selecione um registro</option>{entries.filter((entry) => entry.id !== modal.entry.id).map((entry) => <option key={entry.id} value={entry.id}>{kindLabels[entry.kind]} · {entry.title}</option>)}</select></label><label>Relação<select name="relation">{Object.entries(relationNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="primary" disabled={saving}>Salvar vínculo</button></form>}
      {modal.type === 'delete' && <div className="form-stack"><p>Excluir “{modal.entry.title}” e seus vínculos deste caderno?</p><button className="primary danger-button" disabled={saving} onClick={() => mutate(`${base}/entries/${modal.entry.id}?revision=${modal.entry.revision}`, undefined, 'DELETE').catch(() => {})}>Excluir registro</button><button className="secondary" onClick={() => setModal(null)}>Voltar</button></div>}
    </Modal>}
  </div>;
}
