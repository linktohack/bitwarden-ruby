import 'mocha';
import { expect } from 'chai';

import { Bitwarden } from './bitwarden';

describe('bitwarden encryption stuff', () => {
    it('should make a key from a password and salt', async () => {
        const b64 = '2K4YP5Om9r5NpA7FCS4vQX5t+IC4hKYdTJN/C20cz9c=';

        let key = await Bitwarden.makeKey('this is a password', 'nobody@example.com');
        expect(key.toString('base64')).to.eql(b64);

        key = await Bitwarden.makeKey('this is a password', 'nobody2@example.com');
        expect(key.toString('base64')).to.not.eql(b64);

        key = await Bitwarden.makeKey('this is A password', 'nobody@example.com');
        expect(key.toString('base64')).to.not.eql(b64);
    });

    it('should make a cipher string from a key', async () => {
        const cs = await Bitwarden.makeEncKey(
            await  Bitwarden.makeKey('this is a password', 'nobody@example.com'));
        expect(cs).to.match(/^(\d)\.([^|]+)\|(.+)$/);
    });

    it('should hash a password', async () => {
        expect(await Bitwarden.hashPassword(
            'secret password',
            'user@example.com')).to.eql('VRlYxg0x41v40mvDNHljqpHcqlIFwQSzegeq+POW1ww=');
    });

    it('should parse a cipher string', async () => {
        const cs = Bitwarden.CipherString.parse('0.u7ZhBVHP33j7cud6ImWFcw==|WGcrq5rTEMeyYkWywLmxxxSgHTLBOWThuWRD/6gVKj77+Vd09DiZ83oshVS9+gxyJbQmzXWilZnZRD/52tah1X0MWDRTdI5bTnTf8KfvRCQ=');
        expect(cs.type).to.eql(Bitwarden.CipherString.TYPE_AESCBC256_B64);
        expect(cs.iv).to.eql('u7ZhBVHP33j7cud6ImWFcw==');
        expect(cs.ct).to.eql('WGcrq5rTEMeyYkWywLmxxxSgHTLBOWThuWRD/6gVKj77+Vd09DiZ83oshVS9+gxyJbQmzXWilZnZRD/52tah1X0MWDRTdI5bTnTf8KfvRCQ=');
        expect(cs.mac).to.be.undefined;
    });

    it('should parse a type-3 cipher string', async () => {
        const cs = Bitwarden.CipherString.parse('2.ftF0nH3fGtuqVckLZuHGjg==|u0VRhH24uUlVlTZd/uD1lA==|XhBhBGe7or/bXzJRFWLUkFYqauUgxksCrRzNmJyigfw=');
        expect(cs.type).to.eql(2);
    });


    it('should encrypt and decrypt properly', async () => {
        let ik = await Bitwarden.makeKey('password', 'user@example.com');
        const k = await Bitwarden.makeEncKey(ik);
        const j = await Bitwarden.encrypt('hi there', k.slice(0, 32), k.slice(32, 32));

        const cs = Bitwarden.CipherString.parse(j);

        ik = await Bitwarden.makeKey('password', 'user@example.com');
        expect((await Bitwarden.decrypt(cs.toString(), k.slice(0, 32), k.slice(32, 32))).toString()).to.eql('hi there');
    });

    it('should test mac equality', async () => {
        expect(await Bitwarden.macsEqual('asdfasdfasdf', 'hi', 'hi')).to.be.true;
    });
});
