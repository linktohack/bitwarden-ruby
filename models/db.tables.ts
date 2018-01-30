// tslint:disable
import * as path from 'path';
import * as sequelize from 'sequelize';
import * as def from './db';

export interface ITables {
	users:def.usersModel;
	devices:def.devicesModel;
	ciphers:def.ciphersModel;
	folders:def.foldersModel;
	schema_version:def.schema_versionModel;
}

export const getModels = function(seq:sequelize.Sequelize):ITables {
	const tables:ITables = {
		users: seq.import(path.join(__dirname, './users')),
		devices: seq.import(path.join(__dirname, './devices')),
		ciphers: seq.import(path.join(__dirname, './ciphers')),
		folders: seq.import(path.join(__dirname, './folders')),
		schema_version: seq.import(path.join(__dirname, './schema_version')),
	};
	return tables;
};
