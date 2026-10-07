import { Sequelize, DataTypes } from 'sequelize';

export function createDatabase(config) {
  const sequelize = new Sequelize(config.database, config.user, config.password, { dialect: 'mysql', host: config.dbHost, port: config.dbPort, logging: false, define: { timestamps: true }, pool: { max: 5, min: 0, acquire: 15000 } });
  const id = () => ({ type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 });
  const campaignId = () => ({ type: DataTypes.UUID, allowNull: false });
  const Campaign = sequelize.define('Campaign', { id: id(), name: { type: DataTypes.STRING(200), allowNull: false }, description: DataTypes.TEXT, rulesProfile: DataTypes.STRING(30), gameDay: DataTypes.INTEGER }, { tableName: 'campaigns' });
  const Character = sequelize.define('Character', { id: id(), campaignId: campaignId(), name: DataTypes.STRING(200), className: DataTypes.STRING(200), species: DataTypes.STRING(200), background: DataTypes.STRING(200), level: DataTypes.INTEGER, hp: DataTypes.INTEGER, hpMax: DataTypes.INTEGER, tempHp: DataTypes.INTEGER, armorClass: DataTypes.INTEGER, speed: DataTypes.FLOAT, attributes: DataTypes.JSON, details: DataTypes.JSON, resources: DataTypes.JSON, revision: { type: DataTypes.INTEGER, defaultValue: 0 } }, { tableName: 'characters' });
  const Entry = sequelize.define('Entry', { id: id(), campaignId: campaignId(), characterId: { type: DataTypes.UUID, allowNull: true }, kind: DataTypes.STRING(30), title: DataTypes.STRING(200), body: DataTypes.TEXT('long'), knowledge: DataTypes.STRING(30), source: DataTypes.STRING(1000), sourceKey: { type: DataTypes.STRING(500), allowNull: true }, payload: DataTypes.JSON, revision: { type: DataTypes.INTEGER, defaultValue: 0 } }, { tableName: 'entries' });
  const Link = sequelize.define('Link', { id: id(), campaignId: campaignId(), sourceId: { type: DataTypes.UUID, allowNull: false }, targetId: { type: DataTypes.UUID, allowNull: false }, relation: DataTypes.STRING(30) }, { tableName: 'entry_links' });
  return { sequelize, models: { Campaign, Character, Entry, Link } };
}
