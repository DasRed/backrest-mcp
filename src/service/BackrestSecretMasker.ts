import type BackrestAPIConfigInterface from '@/model/api/BackrestAPIConfigInterface';
import type BackrestAPIHookInterface from '@/model/api/BackrestAPIHookInterface';
import type BackrestAPIPeerStateInterface from '@/model/api/BackrestAPIPeerStateInterface';
import type BackrestAPIPlanInterface from '@/model/api/BackrestAPIPlanInterface';
import type BackrestAPIRepoInterface from '@/model/api/BackrestAPIRepoInterface';
import BackrestExceptionMaskedValue from '@/service/exception/BackrestExceptionMaskedValue';

// same placeholder Backrest itself uses for password hashes of users
const MASK = '********';

// fields of hook actions that contain tokens or URLs with tokens
const HOOK_SECRETS: Record<string, string[]> = {
    actionDiscord:      ['webhookUrl'],
    actionGotify:       ['token'],
    actionHealthchecks: ['webhookUrl'],
    actionShoutrrr:     ['shoutrrrUrl'],
    actionSlack:        ['webhookUrl'],
    actionTelegram:     ['botToken'],
    actionWebhook:      ['webhookUrl'],
};

export default class BackrestSecretMasker {
    protected readonly enabled: boolean;

    static get mask(): string {
        return MASK;
    }

    constructor(enabled: boolean = true) {
        this.enabled = enabled;
    }

    maskConfig<T extends BackrestAPIConfigInterface>(config: T): T {
        if (this.enabled === false) {
            return config;
        }

        const clone = structuredClone(config);
        clone.repos = clone.repos?.map((repo) => this.maskRepo(repo));
        clone.plans = clone.plans?.map((plan) => this.maskPlan(plan));

        for (const token of clone.sync?.pairingTokens ?? []) {
            token.secret = this.maskValue(token.secret) as string | undefined;
        }
        for (const peer of clone.sync?.knownHosts ?? []) {
            peer.initialPairingSecret = this.maskValue(peer.initialPairingSecret) as string | undefined;
        }

        return clone;
    }

    protected maskHook(hook: BackrestAPIHookInterface): BackrestAPIHookInterface {
        for (const [action, fields] of Object.entries(HOOK_SECRETS)) {
            const settings = hook[action] as Record<string, unknown> | undefined;
            if (settings == null) {
                continue;
            }

            for (const field of fields) {
                settings[field] = this.maskValue(settings[field]);
            }
        }

        return hook;
    }

    maskPeerState<T extends BackrestAPIPeerStateInterface>(state: T): T {
        if (this.enabled === false || state.remoteConfig == null) {
            return state;
        }

        const clone = structuredClone(state);
        if (clone.remoteConfig != null) {
            clone.remoteConfig.repos = clone.remoteConfig.repos?.map((repo) => this.maskRepo(repo));
            clone.remoteConfig.plans = clone.remoteConfig.plans?.map((plan) => this.maskPlan(plan));
        }

        return clone;
    }

    protected maskPlan(plan: BackrestAPIPlanInterface): BackrestAPIPlanInterface {
        plan.hooks = plan.hooks?.map((hook) => this.maskHook(hook));

        return plan;
    }

    maskRepo<T extends BackrestAPIRepoInterface>(repo: T): T {
        if (this.enabled === false) {
            return repo;
        }

        const clone    = structuredClone(repo);
        clone.password = this.maskValue(clone.password) as string | undefined;
        clone.env      = clone.env?.map((entry) => (entry.includes('=') ? `${entry.slice(0, entry.indexOf('='))}=${MASK}` : MASK));
        clone.hooks    = clone.hooks?.map((hook) => this.maskHook(hook));

        return clone;
    }

    protected maskValue(value: unknown): unknown {
        return typeof value === 'string' && value !== '' ? MASK : value;
    }

    restoreConfig<T extends BackrestAPIConfigInterface>(config: T, original: BackrestAPIConfigInterface): T {
        const clone = structuredClone(config);
        clone.repos = clone.repos?.map((repo) => this.restoreRepo(repo, original.repos?.find((entry) => entry.id === repo.id)));
        clone.plans = clone.plans?.map((plan) => {
            plan.hooks = this.restoreHooks(`plan ${plan.id}`, plan.hooks, original.plans?.find((entry) => entry.id === plan.id)?.hooks);

            return plan;
        });

        for (const token of clone.sync?.pairingTokens ?? []) {
            if (token.secret === MASK) {
                const match  = original.sync?.pairingTokens?.find((entry) => entry.label === token.label && String(entry.createdAtUnix) === String(token.createdAtUnix));
                token.secret = this.restoreValue(`pairing token ${token.label ?? ''}`, match?.secret);
            }
        }
        for (const peer of clone.sync?.knownHosts ?? []) {
            if (peer.initialPairingSecret === MASK) {
                const match               = original.sync?.knownHosts?.find((entry) => entry.keyId === peer.keyId);
                peer.initialPairingSecret = this.restoreValue(`known host ${peer.instanceId ?? ''}`, match?.initialPairingSecret);
            }
        }

        return clone;
    }

    protected restoreHooks(owner: string, hooks: BackrestAPIHookInterface[] | undefined, originals: BackrestAPIHookInterface[] | undefined): BackrestAPIHookInterface[] | undefined {
        return hooks?.map((hook, index) => {
            for (const [action, fields] of Object.entries(HOOK_SECRETS)) {
                const settings = hook[action] as Record<string, unknown> | undefined;
                if (settings == null) {
                    continue;
                }

                const original = originals?.[index]?.[action] as Record<string, unknown> | undefined;
                for (const field of fields) {
                    if (settings[field] === MASK) {
                        settings[field] = this.restoreValue(`${owner} hook ${index} ${action}.${field}`, original?.[field]);
                    }
                }
            }

            return hook;
        });
    }

    restoreRepo<T extends BackrestAPIRepoInterface>(repo: T, original: BackrestAPIRepoInterface | undefined): T {
        const clone = structuredClone(repo);
        if (clone.password === MASK) {
            clone.password = this.restoreValue(`repo ${clone.id} password`, original?.password);
        }

        clone.env = clone.env?.map((entry, index) => {
            if (entry === MASK) {
                return this.restoreValue(`repo ${clone.id} env ${index}`, original?.env?.[index]);
            }
            if (entry.endsWith(`=${MASK}`) === false) {
                return entry;
            }

            const prefix = entry.slice(0, entry.length - MASK.length);

            return this.restoreValue(`repo ${clone.id} env ${prefix.slice(0, -1)}`, original?.env?.find((value) => value.startsWith(prefix)));
        });
        clone.hooks = this.restoreHooks(`repo ${clone.id}`, clone.hooks, original?.hooks);

        return clone;
    }

    protected restoreValue(name: string, value: unknown): string {
        if (typeof value !== 'string' || value === '') {
            throw new BackrestExceptionMaskedValue(name);
        }

        return value;
    }
}
