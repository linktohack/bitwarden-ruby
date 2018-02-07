import { PassportStatic } from 'passport';
import * as moment from 'moment';

import { Strategy as LocalStrategy } from 'passport-local';
import { db, DevicesInstance } from './db';
import { Request } from 'express';
import { devicesInstance } from './models/db';

import * as DEBUG from 'debug';

interface TokenBody {
    client_id?: string;
    grant_type?: string;
    deviceIdentifier?: string;
    deviceName?: string;
    deviceType?: number;
    password?: string;
    scope?: string;
    username?: string;
    refresh_token?: string;
    devicepushtoken?: string;
}

export interface TokenPayload {
    access_token: string;
    expires_in: number;
    token_type: string;
    refresh_token: string;
    Key: string;
}

export function* need_params(body: TokenBody, ...ps: (keyof TokenBody)[]): IterableIterator<keyof TokenBody> {
    for (const p of ps) {
        if (!body[p]) {
            yield p;
        }
    }
}

export type ValidationError = Error & {
    status: number;
}

export function validation_error(msg: string): ValidationError {
    const error = new Error(msg) as ValidationError;
    error.status = 400;
    return error;
}

export function setup(passport: PassportStatic) {
    passport.use('local', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    }, (req: Request, email: string, password_hash: string, done: any) => {
        const debug = DEBUG('setup:local');
        (async () => {
            const body = req.body as TokenBody;
            debug('body', body);
            let d: devicesInstance | null;
            switch (body.grant_type) {
                case 'refresh_token':
                    debug('refresh_token');
                    for (const p of need_params(body, 'grant_type')) {
                        return done(validation_error(`${p} cannot be blank`));
                    }

                    d = await db.devices.find({ where: { refresh_token: body.refresh_token } });

                    if (!d) {
                        return done(validation_error('Invalid refresh token'));
                    }
                    break;
                case 'password':
                    debug('password');
                    for (const p of need_params(body, 'client_id',
                        'grant_type',
                        'deviceIdentifier',
                        'deviceName',
                        'deviceType',
                        'password',
                        'scope',
                        'username')) {
                        debug('done', p);
                        return done(validation_error(`${p} cannot be blank`));
                    }
                    if (body.scope != 'api offline_access') {
                        return done(validation_error('scope not supported'));
                    }

                    const u = await db.users.find({ where: { email } });

                    if (!u) {
                        return done(validation_error('Invalid username'));
                    }

                    if (u.password_hash !== password_hash) {
                        return done(validation_error('Invalid password'));
                    }

                    d = await db.devices.findById(body.deviceIdentifier);
                    if (d && d.user_uuid !== u.uuid) {
                        await d.destroy();
                        d = null;
                    }

                    debug('found d', d);


                    if (!d) {
                        d = await db.devices.build();
                        d.user_uuid = u.uuid;
                        d.uuid = body.deviceIdentifier;
                    }

                    debug('built d', d);
                    debug('user', u);

                    d.type = body.deviceType;
                    d.name = body.deviceName;
                    if (body.devicepushtoken) {
                        d.push_token = body.devicepushtoken;
                    }
                    break;
                default:
                    return done(validation_error('grant type not supported'));
            }
            debug('woe', d);
            await (d as DevicesInstance).regenerate_tokens();

            await d.save().catch(() => {
                throw validation_error('Unknown error');
            });

            debug('somewhere');

            done(null, {
                access_token: d.access_token,
                expires_in: moment(d.token_expires_at).diff(moment(), 'seconds'),
                token_type: 'Bearer',
                refresh_token: d.refresh_token,
                Key: (d as DevicesInstance).user.key
            } as TokenPayload);

        })()
            .catch((error) => {
                debug('error', error);
                done(error);
            });
    }));
}
