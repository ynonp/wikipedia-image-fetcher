import * as fs from "@std/fs";
import * as path from "jsr:@std/path";
import wiki from "wikipedia";
import {basename} from "https://deno.land/std@0.224.0/url/mod.ts";

import {
  ImageMagick,
  initialize,
  MagickGeometry,
} from "https://deno.land/x/imagemagick_deno@0.0.31/mod.ts";

const domain = Deno.env.get('WIKI_IMAGES_DOMAIN');

function imagesPath(language, topic) {
  return `files/${publicImagesPath(language, topic)}`
}

function publicImagesPath(language, topic) {
  return `${language}/${topic}`;
}

await initialize();

export function toImageURLs(language, topic, names) {
  return names.map(n => `https://${domain}/${publicImagesPath(language, topic)}/${encodeURI(n)}`);
}

export async function getSavedImages(language, topic) {
  const root = imagesPath(language, topic);
  const glob = `${root}/*`;
  const names = await Array.fromAsync(fs.expandGlob(glob));
  return toImageURLs(language, topic, names.map(n => n.name));
}

export async function hasSavedImages(language, topic) {
  return await fs.exists(imagesPath(language, topic));
}

export async function downloadWikipediaImages(language, topic) {
  wiki.setLang(language);
  const page = await wiki.page(topic);
  const imagesInfo = await page.images();
  
  const urls = imagesInfo.map(img => img.url).filter(url =>
    [".jpg", ".jpeg", ".png"].some(e => url.toLowerCase().endsWith(e)));

  const names = urls.map(u => basename(u));
  const imagesRes = await Promise.all(urls.map(u => fetch(u)));
  const buffers = (await Promise.all(imagesRes.map(r => r.arrayBuffer())) ).map(b => new Uint8Array(b));
  
  const dir = imagesPath(language, topic);
  await fs.ensureDir(dir);

  for (let i=0; i < names.length; i++) {
    const fixed = await modifyImage(buffers[i], 512, 512);
    await Deno.writeFile(path.join(dir, names[i]), fixed);
  }

  return toImageURLs(language, topic, names);  
}

export function modifyImage(imageBuffer, maxWidth, maxHeight) {
  return new Promise((resolve) => {
    ImageMagick.read(imageBuffer, (image) => {
      // Get original dimensions
      const originalWidth = image.width;
      const originalHeight = image.height;
      
      // Calculate aspect ratio
      const aspectRatio = originalWidth / originalHeight;
      
      // Calculate new dimensions based on maxWidth and maxHeight
      let width = originalWidth;
      let height = originalHeight;

      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          width = maxWidth;
          height = Math.round(maxWidth / aspectRatio);
        } else {
          height = maxHeight;
          width = Math.round(maxHeight * aspectRatio);
        }
      }

      const sizingData = new MagickGeometry(width, height);
      sizingData.ignoreAspectRatio = false;

      image.resize(sizingData);
      image.write((data) => resolve(data));
    });
  });
}
