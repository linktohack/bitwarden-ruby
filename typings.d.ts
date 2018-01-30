declare module 'util.promisify';

declare module 'passport-jwt' {
    import { Strategy as BaseStrategy } from 'passport';
    import { Request } from 'express';

    export class Strategy implements BaseStrategy {
        constructor(options: any, callback: any)

        authenticate(req: Request, options?: any): void;
    }

    export var ExtractJwt: any;
}
