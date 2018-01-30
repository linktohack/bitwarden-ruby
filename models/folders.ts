/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {foldersInstance, foldersAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
	return sequelize.define<foldersInstance, foldersAttribute>('folders', {
		uuid: {
			type: DataTypes.STRING,
			allowNull: true,
			primaryKey: true
		},
		user_uuid: {
			type: DataTypes.STRING,
			allowNull: true
		},
		name: {
			type: "BLOB",
			allowNull: true
		}
	}, {
		tableName: 'folders',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	});
};
