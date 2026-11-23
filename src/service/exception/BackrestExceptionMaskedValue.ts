import BackrestException from '@/service/exception/BackrestException';

export default class BackrestExceptionMaskedValue extends BackrestException {
    public readonly field: string;

    constructor(field: string) {
        super(`${field} is masked (********) but no stored value exists to restore it, pass the real value instead`);

        this.field = field;
    }
}
