import BackrestExceptionAPI from '@/service/exception/BackrestExceptionAPI';

export default class BackrestExceptionAPIFailedPrecondition extends BackrestExceptionAPI {
    public static readonly identifier: string = 'failed_precondition';
}
