import * as passport from 'passport';

import { Strategy as LocalStrategy } from 'passport-local';
import * as db from './db';
import { devicesInstance } from './models/db';


interface TokenBody {
    client_id?: string;
    grant_type?: string;
    deviceidentifier?: string;
    devicename?: string;
    devicetype?: number;
    password?: string;
    scope?: string;
    username?: string;
    refresh_token?: string;
    devicepushtoken?: string;
}

function* need_params(body: TokenBody, ...ps: (keyof TokenBody)[]): Iterable<keyof TokenBody> {
    for (const p of ps) {
        if (!body[p]) {
            yield p;
        }
    }
}

function validation_error(msg: string): Error {
    return new Error(msg);
}

passport.use('local', new LocalStrategy({
                                            usernameField: 'username',
                                            passwordField: 'password',
                                            passReqToCallback: true
                                        }, (req, email, password_hash, done) => {
    (async () => {
        const body = req.body as TokenBody;
        let d: devicesInstance | null;
        switch (body.grant_type) {
            case 'refresh_token':
                for (const p of need_params(body, 'grant_type')) {
                    return done(validation_error(`${p} cannot be blank`));
                }

                d = await db.devices.find({ where: { refresh_token: body.refresh_token } });

                if (!d) {
                    return done(validation_error('Invalid refresh token'));
                }
                break;
            case 'password':
                for (const p of need_params(body, 'client_id',
                                            'grant_type',
                                            'deviceidentifier',
                                            'devicename',
                                            'devicetype',
                                            'password',
                                            'scope',
                                            'username')) {
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

                d = await db.devices.findById(body.deviceidentifier);
                if (d && d.user_uuid !== u.uuid) {
                    await d.destroy();
                    d = null;
                }

                if (!d) {
                    d = await db.devices.build();
                    d.user_uuid = u.uuid;
                    d.uuid = body.deviceidentifier;
                }

                d.type = body.devicetype;
                d.name = body.devicename;
                if (body.devicepushtoken) {
                    d.push_token = body.devicepushtoken;
                }
                break;
            default:
                return done(validation_error('grant type not supported'));
        }

    })()
        .catch(done);
}));