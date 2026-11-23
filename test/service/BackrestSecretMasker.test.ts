import type BackrestAPIConfigInterface from '@/model/api/BackrestAPIConfigInterface';
import BackrestSecretMasker from '@/service/BackrestSecretMasker';
import BackrestExceptionMaskedValue from '@/service/exception/BackrestExceptionMaskedValue';
import {describe, expect, it} from 'vitest';

const MASK = BackrestSecretMasker.mask;

const CONFIG: BackrestAPIConfigInterface = {
    modno: 1,
    plans: [{hooks: [{actionCommand: {command: 'echo hi'}}, {actionTelegram: {botToken: 'bot-token', chatId: '1'}}], id: 'daily'}],
    repos: [{
        env:      ['AWS_ACCESS_KEY_ID=key', 'PLAIN'],
        hooks:    [{actionGotify: {baseUrl: 'https://gotify', token: 'gotify-token'}}, {actionDiscord: {webhookUrl: 'https://discord/webhook/secret'}}],
        id:       'nas',
        password: 'repo-secret',
        uri:      '/backup',
    }],
    sync:  {
        knownHosts:    [{initialPairingSecret: 'pair-secret', instanceId: 'eros', keyId: 'k1'}],
        pairingTokens: [{createdAtUnix: '100', label: 'eros', secret: 'token-secret'}],
    },
};

describe('BackrestSecretMasker', () => {
    const masker = new BackrestSecretMasker();

    it('masks passwords, env values, hook secrets and pairing secrets', () => {
        const masked = masker.maskConfig(CONFIG);

        expect(masked.repos?.[0]).toEqual({
            env:      [`AWS_ACCESS_KEY_ID=${MASK}`, MASK],
            hooks:    [{actionGotify: {baseUrl: 'https://gotify', token: MASK}}, {actionDiscord: {webhookUrl: MASK}}],
            id:       'nas',
            password: MASK,
            uri:      '/backup',
        });
        expect(masked.plans?.[0]?.hooks).toEqual([{actionCommand: {command: 'echo hi'}}, {actionTelegram: {botToken: MASK, chatId: '1'}}]);
        expect(masked.sync?.knownHosts?.[0]?.initialPairingSecret).toBe(MASK);
        expect(masked.sync?.pairingTokens?.[0]?.secret).toBe(MASK);
        expect(CONFIG.repos?.[0]?.password).toBe('repo-secret');
    });

    it('restores every masked value from the stored config', () => {
        expect(masker.restoreConfig(masker.maskConfig(CONFIG), CONFIG)).toEqual(CONFIG);
    });

    it('keeps changed values and new entries', () => {
        const masked                 = masker.maskConfig(CONFIG);
        masked.repos![0]!.password   = 'new-secret';
        masked.repos![0]!.env        = [`AWS_ACCESS_KEY_ID=${MASK}`, 'NEW=1'];
        masked.repos!.push({id: 'cloud', password: 'cloud-secret'});

        const restored = masker.restoreConfig(masked, CONFIG);

        expect(restored.repos?.[0]?.password).toBe('new-secret');
        expect(restored.repos?.[0]?.env).toEqual(['AWS_ACCESS_KEY_ID=key', 'NEW=1']);
        expect(restored.repos?.[1]).toEqual({id: 'cloud', password: 'cloud-secret'});
    });

    it('fails when a masked value has no stored counterpart', () => {
        expect(() => masker.restoreRepo({id: 'unknown', password: MASK}, undefined)).toThrow(BackrestExceptionMaskedValue);
        expect(() => masker.restoreRepo({env: [`TOKEN=${MASK}`], id: 'nas'}, {id: 'nas'})).toThrow('repo nas env TOKEN');
    });

    it('changes nothing when disabled', () => {
        expect(new BackrestSecretMasker(false).maskConfig(CONFIG)).toBe(CONFIG);
    });
});
