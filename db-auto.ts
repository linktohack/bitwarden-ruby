const SequelizeAuto = require('sequelize-auto');
const auto = new SequelizeAuto('', '', '', {
    storage: 'db/production.sqlite3',
    dialect: 'sqlite',
    directory: 'models',
    typescript: true,
    additional: {
        // timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

auto.run(function (err: Error) {
    if (err) throw err;

    console.log(auto.tables); // table list
    console.log(auto.foreignKeys); // foreign key list
});

