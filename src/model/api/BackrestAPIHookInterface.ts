export default interface BackrestAPIHookInterface {
    [key: string]: unknown;
    actionCommand?: Record<string, unknown>;
    actionDiscord?: Record<string, unknown>;
    actionGotify?: Record<string, unknown>;
    actionHealthchecks?: Record<string, unknown>;
    actionShoutrrr?: Record<string, unknown>;
    actionSlack?: Record<string, unknown>;
    actionTelegram?: Record<string, unknown>;
    actionWebhook?: Record<string, unknown>;
}
