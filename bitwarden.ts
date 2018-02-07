import { createCipheriv, createDecipheriv, createHmac, Decipher, pbkdf2, randomBytes } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import * as forge from 'node-forge';
import * as jwt from 'jsonwebtoken';
import promisify = require('util.promisify');
import ReadWriteStream = NodeJS.ReadWriteStream;

const pbkdf2Async = promisify(pbkdf2);
const randomBytesAsync = promisify(randomBytes);
const existsAsync = promisify(fs.exists);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const generateKeyPairAsync = promisify(forge.pki.rsa.generateKeyPair);

async function fromStream(stream: ReadWriteStream, data: Buffer | string | undefined): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        let encrypted: Buffer[] = [];
        stream.on('readable', () => {
            const data = stream.read();
            if (data) {
                encrypted.push(data instanceof Buffer ? data : Buffer.from(data));
            }
        });
        stream.on('end', () => {
            resolve(Buffer.concat(encrypted));
        });
        data && stream.write(data);
        stream.end();
    });
}

export class Bitwarden {
    static async makeKey(password: string, salt: string): Promise<Buffer> {
        return pbkdf2Async(password, salt, 5000, 32, 'sha256');
    }

    static async makeEncKey(key: Buffer) {
        const pt = await randomBytesAsync(64);
        const iv = await randomBytesAsync(16);

        const cipher = createCipheriv('aes-256-cbc', key, iv);
        const ct = await fromStream(cipher, pt);
        return new Bitwarden.CipherString(Bitwarden.CipherString.TYPE_AESCBC256_B64,
            iv.toString('base64'),
            ct.toString('base64')).toString();
    }

    static async hashPassword(password: string, salt: string): Promise<string> {
        const key = await this.makeKey(password, salt);
        return (await pbkdf2Async(key, password, 1, 32, 'sha256')).toString('base64');
    }

    static async encrypt(pt: Buffer | string, key: Buffer | string, macKey: string): Promise<string> {
        const iv = await randomBytesAsync(16);

        const cipher = createCipheriv('aes-256-cbc', key, iv);
        const ct = await fromStream(cipher, pt);

        const mac = await fromStream(createHmac('sha256', macKey), Buffer.concat([iv, ct]));

        return new Bitwarden.CipherString(Bitwarden.CipherString.TYPE_AESCBC256_HMACSHA256_B64,
            iv.toString('base64'),
            ct.toString('base64'),
            mac.toString('base64')).toString();
    }

    static async macsEqual(macKey: string, mac1: Buffer | string | undefined, mac2: Buffer | string | undefined): Promise<boolean> {
        if (mac1 === undefined) {
            return mac2 === undefined;
        } else {
            if (mac2 === undefined) {
                return false;
            }
        }

        const hmac1 = await fromStream(createHmac('sha256', macKey), mac1);
        const hmac2 = await fromStream(createHmac('sha256', macKey), mac2);

        return hmac1.equals(hmac2);
    }

    static async decrypt(str: string, key: Buffer | string, macKey: string): Promise<Buffer> {
        const c = Bitwarden.CipherString.parse(str);
        const iv = Buffer.from(c.iv, 'base64');
        const ct = Buffer.from(c.ct, 'base64');
        const mac = c.mac ? Buffer.from(c.mac, 'base64') : undefined;

        let decipher: Decipher;
        let pt: Buffer;

        switch (c.type) {
            case Bitwarden.CipherString.TYPE_AESCBC256_B64:
                decipher = createDecipheriv('aes-256-cbc', key, iv);
                pt = await fromStream(decipher, ct);
                return pt;

            case Bitwarden.CipherString.TYPE_AESCBC256_HMACSHA256_B64:
                const cmac = await fromStream(createHmac('sha256', macKey), Buffer.concat([iv, ct]));
                if (!this.macsEqual(macKey, mac, cmac)) {
                    throw new Error('invalid mac');
                }
                decipher = createDecipheriv('aes-256-cbc', key, iv);
                pt = await fromStream(decipher, ct);
                return pt;
        }
        throw new Error(`TODO implement ${c.type}`);
    }
}

export module Bitwarden {

    export class CipherString {
        static readonly TYPE_AESCBC256_B64 = 0;
        static readonly TYPE_AESCBC128_HMACSHA256_B64 = 1;
        static readonly TYPE_AESCBC256_HMACSHA256_B64 = 2;
        static readonly TYPE_RSA2048_OAEPSHA256_B64 = 3;
        static readonly TYPE_RSA2048_OAEPSHA1_B64 = 4;
        static readonly TYPE_RSA2048_OAEPSHA256_HMACSHA256_B64 = 5;
        static readonly TYPE_RSA2048_OAEPSHA1_HMACSHA256_B64 = 6;

        constructor(public type: number,
                    public iv: string,
                    public ct: string,
                    public mac?: string) {

        }

        static parse(str: string): CipherString {
            const m = str.match(/^(\d)\.([^|]+)\|(.+)$/);
            if (!m) {
                throw new InvalidCipherString(`invalid CipherString: ${str}`);
            }
            const type = parseInt(m[1]);
            const iv = m[2];
            const [ct, mac] = m[3].split('|', 2);
            return new CipherString(type, iv, ct, mac);
        }

        toString() {
            return [`${this.type}.${this.iv}`, this.ct, this.mac]
                .filter(it => it)
                .join('|');
        }
    }

    export class InvalidCipherString extends Error {
    }

    export class Token {
        static readonly KEY = path.join(__dirname, 'db/jwt-rsa.key');

        static rsa: string;

        static async load_keys() {
            if (await existsAsync(this.KEY)) {
                this.rsa = await readFileAsync(this.KEY);
            } else {
                const pair: forge.pki.KeyPair = await generateKeyPairAsync({ bits: 2048 });
                this.rsa = forge.pki.privateKeyToPem(pair.privateKey);
                await writeFileAsync(this.KEY, this.rsa);
            }
        }

        static sign(payload: Buffer | string | object): string {
            return jwt.sign(payload, this.rsa, { algorithm: 'RS256' });
        }
    }
}


