'use client';

const attributes = [
  ['str', 'FOR', 'Força'],
  ['dex', 'DES', 'Destreza'],
  ['con', 'CON', 'Constituição'],
  ['int', 'INT', 'Inteligência'],
  ['wis', 'SAB', 'Sabedoria'],
  ['cha', 'CAR', 'Carisma'],
];

const saves = attributes.map(([, short, name]) => ({ value: short, label: `${short} · ${name}` }));
const skills = [
  'Acrobacia', 'Arcanismo', 'Atletismo', 'Atuação', 'Enganação', 'Furtividade',
  'História', 'Intimidação', 'Intuição', 'Investigação', 'Lidar com Animais',
  'Medicina', 'Natureza', 'Percepção', 'Persuasão', 'Prestidigitação', 'Religião', 'Sobrevivência',
];
const managedDetails = new Set([
  'História', 'Ideal', 'Vínculos', 'Defeitos', 'Idiomas', 'Proficiências',
  'Perícias', 'Salvaguardas', 'Especializações', 'Perícias e salvaguardas',
]);

function selectedValues(value = '') {
  return new Set(String(value).split(',').map((item) => item.trim()).filter(Boolean));
}

function setDetail(details, key, value) {
  const clean = String(value ?? '').trim();
  if (clean) details[key] = clean;
  else delete details[key];
}

export default function CharacterEditor({ character, busy, onSave }) {
  const details = character?.details ?? {};
  const selectedSkills = selectedValues(details['Perícias']);
  const selectedSaves = selectedValues(details['Salvaguardas']);
  const legacySkills = details['Perícias e salvaguardas'];
  const extraDetails = Object.entries(details).filter(([key]) => !managedDetails.has(key));

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextDetails = Object.fromEntries(extraDetails);
    const resources = (character?.resources ?? []).map((resource, index) => ({
      ...resource,
      current: Number(data.get(`resource-${index}`)),
    }));

    setDetail(nextDetails, 'História', data.get('history'));
    setDetail(nextDetails, 'Ideal', data.get('ideal'));
    setDetail(nextDetails, 'Vínculos', data.get('bonds'));
    setDetail(nextDetails, 'Defeitos', data.get('flaws'));
    setDetail(nextDetails, 'Idiomas', data.get('languages'));
    setDetail(nextDetails, 'Proficiências', data.get('proficiencies'));
    setDetail(nextDetails, 'Especializações', data.get('expertise'));
    setDetail(nextDetails, 'Perícias', data.getAll('skills').join(', '));
    setDetail(nextDetails, 'Salvaguardas', data.getAll('saves').join(', '));
    if (legacySkills) nextDetails['Perícias e salvaguardas'] = legacySkills;

    const values = {
      name: data.get('name'),
      className: data.get('className'),
      species: data.get('species'),
      background: data.get('background'),
      level: Number(data.get('level')),
      hp: Number(data.get('hp')),
      hpMax: Number(data.get('hpMax')),
      tempHp: Number(data.get('tempHp')),
      armorClass: Number(data.get('armorClass')),
      speed: Number(data.get('speed')),
      attributes: Object.fromEntries(attributes.map(([key]) => [key, Number(data.get(key))])),
      details: nextDetails,
      resources,
    };

    await onSave(values);
  }

  return <form className="character-editor" onSubmit={submit}>
    <fieldset className="character-form-section">
      <legend>Identidade do personagem</legend>
      <div className="character-form-grid identity-fields">
        <label className="field-span-2">Nome do personagem<input autoFocus name="name" required maxLength="200" defaultValue={character?.name ?? ''} /></label>
        <label>Classe<input name="className" maxLength="200" defaultValue={character?.className ?? ''} /></label>
        <label>Raça / espécie<input name="species" maxLength="200" defaultValue={character?.species ?? ''} /></label>
        <label>Antecedente<input name="background" maxLength="200" defaultValue={character?.background ?? ''} /></label>
        <label>Nível<input name="level" type="number" min="1" max="20" required defaultValue={character?.level ?? 1} /></label>
      </div>
    </fieldset>

    <fieldset className="character-form-section">
      <legend>Combate e movimentação</legend>
      <div className="character-form-grid combat-fields">
        <label>PV atual<input name="hp" type="number" min="0" max="10000" required defaultValue={character?.hp ?? 10} /></label>
        <label>PV máximo<input name="hpMax" type="number" min="1" max="10000" required defaultValue={character?.hpMax ?? 10} /></label>
        <label>PV temporário<input name="tempHp" type="number" min="0" max="10000" required defaultValue={character?.tempHp ?? 0} /></label>
        <label>Classe de armadura<input name="armorClass" type="number" min="0" max="100" required defaultValue={character?.armorClass ?? 10} /></label>
        <label>Deslocamento (m)<input name="speed" type="number" min="0" max="1000" step="0.1" required defaultValue={character?.speed ?? 9} /></label>
      </div>
    </fieldset>

    <fieldset className="character-form-section">
      <legend>Atributos</legend>
      <div className="attribute-form-grid">
        {attributes.map(([key, short, name]) => <label key={key}><span>{short}</span><small>{name}</small><input name={key} type="number" min="1" max="30" required defaultValue={character?.attributes?.[key] ?? 10} /></label>)}
      </div>
    </fieldset>

    <div className="character-form-columns">
      <fieldset className="character-form-section">
        <legend>Salvaguardas proficientes</legend>
        <p className="form-help">Marque apenas as salvaguardas em que o personagem possui proficiência.</p>
        <div className="choice-grid save-grid">
          {saves.map((save) => <label className="choice-chip" key={save.value}><input type="checkbox" name="saves" value={save.value} defaultChecked={selectedSaves.has(save.value)} /><span>{save.label}</span></label>)}
        </div>
      </fieldset>

      <fieldset className="character-form-section">
        <legend>Perícias proficientes</legend>
        <p className="form-help">As perícias ficam separadas das salvaguardas para consulta rápida na ficha.</p>
        <div className="choice-grid skill-grid">
          {skills.map((skill) => <label className="choice-chip" key={skill}><input type="checkbox" name="skills" value={skill} defaultChecked={selectedSkills.has(skill)} /><span>{skill}</span></label>)}
        </div>
      </fieldset>
    </div>

    <fieldset className="character-form-section">
      <legend>Proficiências e conhecimentos</legend>
      <div className="character-form-grid">
        <label>Especializações<input name="expertise" defaultValue={details['Especializações'] ?? ''} placeholder="Ex.: Furtividade, Percepção" /></label>
        <label>Idiomas<input name="languages" defaultValue={details['Idiomas'] ?? ''} placeholder="Ex.: Comum, Élfico" /></label>
        <label className="field-span-2">Outras proficiências<textarea name="proficiencies" rows="2" defaultValue={details['Proficiências'] ?? ''} placeholder="Armas, armaduras, ferramentas ou treinamentos especiais" /></label>
      </div>
      {legacySkills && <div className="legacy-field"><strong>Anotação anterior de perícias/salvaguardas</strong><p>{legacySkills}</p><small>Este texto foi preservado para não perder informação antiga. Use os campos acima para estruturar os próximos registros.</small></div>}
    </fieldset>

    <fieldset className="character-form-section">
      <legend>Interpretação e história</legend>
      <div className="character-form-grid narrative-fields">
        <label className="field-span-2">História<textarea name="history" rows="3" defaultValue={details['História'] ?? ''} /></label>
        <label>Ideal<textarea name="ideal" rows="2" defaultValue={details['Ideal'] ?? ''} /></label>
        <label>Vínculos<textarea name="bonds" rows="2" defaultValue={details['Vínculos'] ?? ''} /></label>
        <label className="field-span-2">Defeitos / complicações<textarea name="flaws" rows="2" defaultValue={details['Defeitos'] ?? ''} /></label>
      </div>
    </fieldset>

    {extraDetails.length > 0 && <fieldset className="character-form-section">
      <legend>Informações adicionais já registradas</legend>
      <div className="legacy-details-grid">{extraDetails.map(([key, value]) => <div key={key}><strong>{key}</strong><p className="preserve-text">{value}</p></div>)}</div>
    </fieldset>}

    {(character?.resources ?? []).length > 0 && <fieldset className="character-form-section">
      <legend>Recursos registrados</legend>
      <div className="character-form-grid">{character.resources.map((resource, index) => <label key={`${resource.name}-${index}`}>{resource.name}<input name={`resource-${index}`} type="number" min="0" max={resource.max} defaultValue={resource.current} /><small>Máximo: {resource.max}</small></label>)}</div>
    </fieldset>}

    <div className="character-form-actions"><button className="primary" disabled={busy}>{busy ? 'Salvando…' : character ? 'Salvar alterações' : 'Criar personagem'}</button></div>
  </form>;
}
