import BackrestExceptionAPI from '@/service/exception/BackrestExceptionAPI';

export default class BackrestExceptionAPINotFound extends BackrestExceptionAPI {
    public static readonly identifier: string = 'not_found';
}
