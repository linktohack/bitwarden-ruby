/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {foldersInstance, foldersAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
	return sequelize.define<foldersInstance, foldersAttribute>('folders', {
		uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
			allowNull: true,
			primaryKey: true
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: true
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
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	});
};
