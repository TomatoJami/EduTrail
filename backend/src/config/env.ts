import dotenv from 'dotenv';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

/** Chooses the environment file before any backend service reads process.env. */
const envFile = process.env.ENV_FILE || (process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local');

/** Searches both runtime and compiled locations so dev/test/build use the same loader. */
const envPaths = [
  path.resolve(process.cwd(), envFile),
  path.resolve(__dirname, `../../${envFile}`),
  path.resolve(__dirname, `../${envFile}`),
];

/** Falls back to the first candidate so dotenv can still report missing values consistently. */
const envPath = envPaths.find((candidate) => fs.existsSync(candidate)) || envPaths[0];

dotenv.config({
  path: envPath,
});

/** Uses public DNS resolvers to avoid local resolver issues with hosted MongoDB clusters. */
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

export { envFile, envPath };
