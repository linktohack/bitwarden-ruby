/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {devicesInstance, devicesAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
	return sequelize.define<devicesInstance, devicesAttribute>('devices', {
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
			type: DataTypes.STRING,
			allowNull: true
		},
		type: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		push_token: {
			type: DataTypes.STRING,
			allowNull: true
		},
		access_token: {
			type: DataTypes.STRING,
			allowNull: true
		},
		refresh_token: {
			type: DataTypes.STRING,
			allowNull: true
		},
		token_expires_at: {
			type: DataTypes.DATE,
			allowNull: true
		}
	}, {
		tableName: 'devices',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	});
};
