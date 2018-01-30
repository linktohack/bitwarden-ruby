import { createCipheriv, createDecipheriv, createHmac, Decipher, pbkdf2, randomBytes } from 'crypto';
import * as promisify from 'util.promisify';

const pbkdf2Async = promisify(pbkdf2);
const randomBytesAsync = promisify(randomBytes);

export class Bitwarden {
    static async makeKey(password: string, salt: string): Promise<Buffer> {
        return pbkdf2Async(password, salt, 5000, 32, 'sha256');
    }

    static async makeEncKey(key: Buffer) {
        const pt = await randomBytesAsync(64);
        const iv = await randomBytesAsync(16);

        const cipher = createCipheriv('aes-256-cbc', key, iv);
        let ct = cipher.update(pt);
        ct = Buffer.concat([ct, cipher.final()]);
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
        let ct = cipher.update(pt instanceof Buffer ? pt : Buffer.from(pt));
        ct = Buffer.concat([ct, cipher.final()]);

        const mac = createHmac('sha256', macKey);
        mac.update(Buffer.concat([iv, ct]));
        return new Bitwarden.CipherString(Bitwarden.CipherString.TYPE_AESCBC256_HMACSHA256_B64,
                                          iv.toString('base64'),
                                          ct.toString('base64'),
                                          mac.digest('base64')).toString();
    }

    static macsEqual(macKey: string, mac1: Buffer | string | undefined, mac2: Buffer | string | undefined): boolean {
        if (mac1 === undefined) {
            return mac2 === undefined;
        } else {
            if (mac2 === undefined) {
                return false;
            }
        }

        const hmac1 = createHmac('sha256', macKey);
        hmac1.update(mac1);
        const hmac2 = createHmac('sha256', macKey);
        hmac2.update(mac2);

        return hmac1.digest().equals(hmac2.digest());
    }

    static decrypt(str: string, key: Buffer | string, macKey: string): Buffer {
        const c = Bitwarden.CipherString.parse(str);
        const iv = Buffer.from(c.iv, 'base64');
        const ct = Buffer.from(c.ct, 'base64');
        const mac = c.mac ? Buffer.from(c.mac, 'base64') : undefined;

        let decipher: Decipher;
        let pt: Buffer;

        switch (c.type) {
            case Bitwarden.CipherString.TYPE_AESCBC256_B64:
                decipher = createDecipheriv('aes-256-cbc', key, iv);
                pt = decipher.update(ct);
                return Buffer.concat([pt, decipher.final()]);

            case Bitwarden.CipherString.TYPE_AESCBC256_HMACSHA256_B64:
                const cmac = createHmac('sha256', macKey);
                cmac.update(Buffer.concat([iv, ct]));
                if (!this.macsEqual(macKey, mac, cmac.digest())) {
                    throw new Error('invalid mac');
                }
                decipher = createDecipheriv('aes-256-cbc', key, iv);
                pt = decipher.update(ct);
                return Buffer.concat([pt, decipher.final()]);
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
}


