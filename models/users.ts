/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {usersInstance, usersAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
	return sequelize.define<usersInstance, usersAttribute>('users', {
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
		email: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		email_verified: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		},
		premium: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		},
		name: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		password_hash: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		password_hint: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		key: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		private_key: {
			type: "BLOB",
			allowNull: true
		},
		public_key: {
			type: "BLOB",
			allowNull: true
		},
		totp_secret: {
			type: DataTypes.STRING,
			allowNull: true
		},
		security_stamp: {
			type: DataTypes.STRING,
			allowNull: true
		},
		culture: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		tableName: 'users',
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	});
};
