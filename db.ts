import * as Sequelize from 'sequelize';

import { getModels } from './models/db.tables';


const sequelize = new Sequelize('', '', '', {
    storage: 'db/production.sqlite3',
    dialect: 'sqlite',
    define: {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});


const db = {
    ...getModels(sequelize),

    Sequelize,
    sequelize

};

db.ciphers.belongsTo(db.users);
db.ciphers.belongsTo(db.folders);

db.devices.belongsTo(db.users);

db.users.hasMany(db.ciphers);
db.users.hasMany(db.devices);

db.folders.hasMany(db.ciphers);

export = db;
