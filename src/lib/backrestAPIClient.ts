import config from '@/config';
import backrestSecretMasker from '@/lib/backrestSecretMasker';
import BackrestAPIClient from '@/service/BackrestAPIClient';

const backrestAPIClient = new BackrestAPIClient({
    masker:    backrestSecretMasker,
    password:  config.backrest.password,
    publicURL: config.backrest.publicURL,
    timeout:   config.backrest.timeout,
    url:       config.backrest.url,
    username:  config.backrest.username,
});

export default backrestAPIClient;
