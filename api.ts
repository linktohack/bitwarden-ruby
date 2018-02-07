import * as express from 'express';
import { Request, Response } from 'express';
import * as passport from 'passport';
import { setup, TokenPayload, ValidationError } from './auth';
import { Bitwarden } from './bitwarden';
import { db } from './db';
import * as _ from 'lodash';
import * as moment from 'moment';
import { devicesInstance } from './models/db';
import * as bodyParser from 'body-parser';

import * as DEBUG from 'debug';

const app = express();

setup(passport);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false }));

const validation_error_for_res = (res: Response) => (msg: string) => {
    res.status(400).json({ error: msg });
};

export function* need_params(body: any, ...ps: string[]): IterableIterator<string> {
    for (const p of ps) {
        if (!body[p]) {
            yield p;
        }
    }
}

async function device_from_bearer(req: Request): Promise<devicesInstance | null> {
    const auth = req.header('HTTP_AUTHORIZATION');
    const m = auth && auth.match(/^Bearer (.+)/);
    if (m) {
        const token = m[1];
        const d = await db.devices.find({
            where: { access_token: token },
            include: [{ model: db.users, include: [db.ciphers, db.folders] }]
        });
        if (d && moment(d.token_expires_at).isAfter(moment())) {
            return d;
        }
    }
    return null;
}

app.post('/identity/connect/token', (req, res, next) => {
    const debug = DEBUG('identity:connect:token');
    debug('req', req.body);
    passport.authenticate('local', function (error: ValidationError, token: TokenPayload) {
        debug('auth', error);
        if (error) {
            return res.status(error.status).json(error);
        }
        res.json(token);
    })(req, res, next);
});

export const ALLOW_SIGNUPS = true;

app.post('/api/accounts/register', (req, res) => {
    const debug = DEBUG('api:account:register');

    (async () => {
        const validation_error = validation_error_for_res(res);

        if (!ALLOW_SIGNUPS) {
            throw validation_error('Signups are not permitted');
        }
        debug('body', req.body);
        for (const p of need_params(req.body, 'masterPasswordHash')) {
            throw validation_error(`${p} cannot be blank`);
        }
        if (!req.body.email || !/^.+@.+\..+$/.test(req.body.email)) {
            throw validation_error('Invalid e-mail address');
        }

        if (!req.body.key || !/^0\..+\|.+/.test(req.body.key)) {
            throw validation_error('Invalid key');
        }

        try {
            Bitwarden.CipherString.parse(req.body.key);
        } catch (error) {
            if (error instanceof Bitwarden.InvalidCipherString) {
                throw validation_error('Invalid key');
            }
        }

        await db.sequelize.transaction(async (t) => {
            const email = _.toLower(req.body.email);

            if (await db.users.find({ where: { email: email }, transaction: t })) {
                throw validation_error('E-mail is already in use');
            }

            await db.users
                .create({
                    email,
                    password_hash: req.body.masterPasswordHash,
                    password_hint: req.body.masterPasswordHint,
                    key: req.body.key,
                    culture: 'en-US',
                    premium: true
                }, { transaction: t })
                .catch(() => {
                    throw validation_error('User save failed');
                });
        });

        res.end('');
    })()
        .catch((error) => {
            debug('error', error);
            res.status(500).json(error);
        });
});

app.post('/sync', (req, res) => {
    (async () => {
        const validation_error = validation_error_for_res(res);

        const d = await device_from_bearer(req);
        if (!d) {
            throw validation_error('invalid bearer');
        }

        res.json({
            Profile: (d as any).user,
            Folders: (d as any).user.folders,
            Ciphers: (d as any).user.ciphers,
            Domains: {
                EquivalentDomains: null,
                GlobalEquivalentDomains: [],
                Object: 'domains'
            },
            Object: 'sync'
        });
    })()
        .catch(res.json);
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));
