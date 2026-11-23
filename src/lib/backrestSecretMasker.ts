import config from '@/config';
import BackrestSecretMasker from '@/service/BackrestSecretMasker';

const backrestSecretMasker = new BackrestSecretMasker(config.mcp.maskSecrets);

export default backrestSecretMasker;
