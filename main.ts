import { Hono } from 'hono'
import * as lib from './lib/wikipedia_fetcher.js';

const app = new Hono()

app.get('/up', (c) => {
  return c.json({ok: true})
})

app.get('/images', async (c) => {
  const { topic, lang } = c.req.query();
  if (await lib.hasSavedImages(lang, topic)) {
    const images = await lib.getSavedImages(lang, topic);
    return c.json(images);
  } else {
    const images = await lib.downloadWikipediaImages(lang, topic);
    return c.json(images);
  }
})

Deno.serve(app.fetch)
