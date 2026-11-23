import BackrestExceptionAPI from '@/service/exception/BackrestExceptionAPI';

export default class BackrestExceptionAPIPermissionDenied extends BackrestExceptionAPI {
    public static readonly identifier: string = 'permission_denied';
}
