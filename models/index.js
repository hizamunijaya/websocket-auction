const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// sequelize 인스턴스화
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Good = require('./good')(sequelize, Sequelize);
db.Auction = require('./auction')(sequelize, Sequelize);

// 1: N = User:Auction
db.User.hasMany(db.Auction);
db.Auction.belongsTo(db.User);

// 1: N = Good:Auction
db.Good.hasMany(db.Auction);
db.Auction.belongsTo(db.Good);

// 1:N = User:Good (owner)
db.User.hasMany(db.Good);
db.Good.belongsTo(db.User, { as: 'owner' });

// 1:N = User:Good (sold)
db.User.hasMany(db.Good);
db.Good.belongsTo(db.User, { as: 'sold' });

module.exports = db;
