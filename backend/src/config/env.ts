import dotenv from 'dotenv';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

const envFile = process.env.ENV_FILE || (process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local');
const envPaths = [
  path.resolve(process.cwd(), envFile),
  path.resolve(__dirname, `../../${envFile}`),
  path.resolve(__dirname, `../${envFile}`),
];
const envPath = envPaths.find((candidate) => fs.existsSync(candidate)) || envPaths[0];

dotenv.config({
  path: envPath,
});

dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

export { envFile, envPath };
