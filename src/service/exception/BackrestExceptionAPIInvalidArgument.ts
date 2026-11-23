import BackrestExceptionAPI from '@/service/exception/BackrestExceptionAPI';

export default class BackrestExceptionAPIInvalidArgument extends BackrestExceptionAPI {
    public static readonly identifier: string = 'invalid_argument';
}
