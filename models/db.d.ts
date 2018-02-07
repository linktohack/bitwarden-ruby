// tslint:disable
import * as Sequelize from 'sequelize';


// table: users
export interface usersAttribute {
	uuid?:string;
	created_at?:Date;
	updated_at?:Date;
	email?:string;
	email_verified?:boolean;
	premium?:boolean;
	name?:string;
	password_hash?:string;
	password_hint?:string;
	key?:string;
	private_key?:any;
	public_key?:any;
	totp_secret?:string;
	security_stamp?:string;
	culture?:string;
}
export interface usersInstance extends Sequelize.Instance<usersAttribute>, usersAttribute { }
export interface usersModel extends Sequelize.Model<usersInstance, usersAttribute> { }

// table: devices
export interface devicesAttribute {
	uuid?:string;
	created_at?:Date;
	updated_at?:Date;
	user_uuid?:string;
	name?:string;
	type?:number;
	push_token?:string;
	access_token?:string;
	refresh_token?:string;
	token_expires_at?:Date;
}
export interface devicesInstance extends Sequelize.Instance<devicesAttribute>, devicesAttribute { }
export interface devicesModel extends Sequelize.Model<devicesInstance, devicesAttribute> { }

// table: ciphers
export interface ciphersAttribute {
	uuid?:string;
	created_at?:Date;
	updated_at?:Date;
	user_uuid?:string;
	folder_uuid?:string;
	organization_uuid?:string;
	type?:number;
	data?:any;
	favorite?:boolean;
	attachments?:any;
}
export interface ciphersInstance extends Sequelize.Instance<ciphersAttribute>, ciphersAttribute { }
export interface ciphersModel extends Sequelize.Model<ciphersInstance, ciphersAttribute> { }

// table: folders
export interface foldersAttribute {
	uuid?:string;
	created_at?:Date;
	updated_at?:Date;
	user_uuid?:string;
	name?:any;
}
export interface foldersInstance extends Sequelize.Instance<foldersAttribute>, foldersAttribute { }
export interface foldersModel extends Sequelize.Model<foldersInstance, foldersAttribute> { }

// table: schema_version
export interface schema_versionAttribute {
	version?:number;
}
export interface schema_versionInstance extends Sequelize.Instance<schema_versionAttribute>, schema_versionAttribute { }
export interface schema_versionModel extends Sequelize.Model<schema_versionInstance, schema_versionAttribute> { }
