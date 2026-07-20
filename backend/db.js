const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'operator' },
  fullName: { type: DataTypes.STRING, allowNull: false },
  telegramChatId: { type: DataTypes.STRING, allowNull: true },
});

const Event = sequelize.define('Event', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  venue: { type: DataTypes.STRING, allowNull: false },
  cameraCount: { type: DataTypes.INTEGER, defaultValue: 1 },
  notified: { type: DataTypes.BOOLEAN, defaultValue: false }
});

User.belongsToMany(Event, { through: 'EventOperators', as: 'events' });
Event.belongsToMany(User, { through: 'EventOperators', as: 'assignedOperators' });

module.exports = { sequelize, User, Event };
