import * as Sequelize from 'sequelize';
import * as moment from 'moment';
import { randomBytes } from 'crypto';
import { getModels } from './models/db.tables';
import {
    ciphersAttribute,
    devicesInstance,
    devicesModel,
    foldersAttribute,
    usersAttribute,
    usersInstance,
    usersModel
} from './models/db';
import { Bitwarden } from './bitwarden';

import * as DEBUG from 'debug';
import promisify = require('util.promisify');

const randomBytesAsync = promisify(randomBytes);

const sequelize = new Sequelize('', '', '', {
    storage: 'db/production.sqlite3',
    dialect: 'sqlite',
    define: {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});


export const db = {
    ...getModels(sequelize),

    Sequelize,
    sequelize

};

const debug = DEBUG('db');
export const IDENTITY_BASE_URL = '/identity';

export type DevicesModel = devicesModel & {
    prototype: DevicesInstance
}
export type DevicesInstance = devicesInstance & {
    user: usersInstance,
    regenerate_tokens: (validity?: number) => Promise<void>
}

export type UsersModel = usersModel & {
    prototype: usersInstance
}

async function urlsafe_base64(size: number): Promise<string> {
    const buffer = await randomBytesAsync(size);
    return buffer.buffer('base64')
        .replace(/\+/g, '-') // Convert '+' to '-'
        .replace(/\//g, '_') // Convert '/' to '_'
        .replace(/=+$/, ''); // Remove ending '='
}


const DEFAULT_TOKEN_VALIDITY = 3600;

(db.devices as DevicesModel).prototype.regenerate_tokens = async function (validity = DEFAULT_TOKEN_VALIDITY) {
    const self = this as DevicesInstance;
    debug('device', self);
    if (self.refresh_token) {
        self.refresh_token = (await urlsafe_base64(64)).slice(0, 64);
    }

    self.token_expires_at = moment().add(validity, 'seconds').toDate();

    self.user = await db.users.findById(self.user_uuid) as usersInstance; // let it crash
    debug('user', self.user);

    self.access_token = Bitwarden.Token.sign({
        nbf: moment().subtract(2, 'hours').valueOf(),
        exp: self.token_expires_at.valueOf(),
        iss: IDENTITY_BASE_URL,
        sub: self.user.uuid,
        premium: self.user.premium,
        name: self.user.name,
        email: self.user.email,
        email_verified: self.user.email_verified,
        sstamp: self.user.security_stamp,
        device: self.uuid,
        scope: ['api', 'offline_access'],
        amr: ['Application']
    });
};

(db.users as UsersModel).prototype.toJSON = function () {
    const self = this as usersInstance;

    return {
        Id: self.uuid,
        Name: self.name,
        Email: self.email,
        EmailVerified: self.email_verified,
        Premium: self.premium,
        MasterPasswordHint: self.password_hint,
        Culture: self.culture,
        TwoFactorEnabled: false,
        Key: self.key,
        PrivateKey: null,
        SecurityStamp: self.security_stamp,
        Organizations: [],
        Object: 'profile'
    };
} as () => usersAttribute;

(db.folders as any).prototype.toJSON = function () {
    const self = this as foldersAttribute;

    return {
        Id: self.uuid,
        RevisionDate: self.updated_at,
        Name: self.name,
        Object: 'folder'

    };
};

(db.ciphers as any).prototype.toJSON = function () {
    const self = this as ciphersAttribute;

    return {
        Id: self.uuid,
        Type: self.type,
        RevisionDate: self.updated_at,
        FolderId: self.folder_uuid,
        Favorite: self.favorite,
        OrganizationId: null,
        Attachments: self.attachments,
        OrganizationUseTotp: false,
        Data: JSON.parse(self.data),
        Object: 'cipher'
    };
};


db.ciphers.belongsTo(db.users, { foreignKey: 'user_uuid' });
db.ciphers.belongsTo(db.folders, { foreignKey: 'folder_uuid' });

db.devices.belongsTo(db.users, { foreignKey: 'user_uuid' });

db.users.hasMany(db.ciphers, { foreignKey: 'user_uuid' });
db.users.hasMany(db.devices, { foreignKey: 'user_uuid' });

db.folders.hasMany(db.ciphers, { foreignKey: 'folder_uuid' });

