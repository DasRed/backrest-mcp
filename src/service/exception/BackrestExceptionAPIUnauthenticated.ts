import BackrestExceptionAPI from '@/service/exception/BackrestExceptionAPI';

export default class BackrestExceptionAPIUnauthenticated extends BackrestExceptionAPI {
    public static readonly identifier: string = 'unauthenticated';
}
