/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {ciphersInstance, ciphersAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
	return sequelize.define<ciphersInstance, ciphersAttribute>('ciphers', {
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
		folder_uuid: {
			type: DataTypes.STRING,
			allowNull: true
		},
		organization_uuid: {
			type: DataTypes.STRING,
			allowNull: true
		},
		type: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		data: {
			type: "BLOB",
			allowNull: true
		},
		favorite: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		},
		attachments: {
			type: "BLOB",
			allowNull: true
		}
	}, {
		tableName: 'ciphers',
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	});
};
