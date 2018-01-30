/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {schema_versionInstance, schema_versionAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
	return sequelize.define<schema_versionInstance, schema_versionAttribute>('schema_version', {
		version: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'schema_version',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	});
};
