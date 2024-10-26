import * as lib from './lib/wikipedia_fetcher.js';

const buf = Deno.readFileSync("Dachfenster_5.jpg");
const r = await lib.modifyImage(buf, 512, 512);
await Deno.writeFile("test.jpg", r);