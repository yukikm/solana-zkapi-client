/** Build the historical fixed-request UI. The operator runs its separate relay. */
import {resolve} from 'node:path';
import {buildUi} from './build.ts';
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--out-dir') throw Error('usage: node legacy-wallet/launch.ts --out-dir OUTPUT_DIRECTORY');
await buildUi(resolve(args[1]));
