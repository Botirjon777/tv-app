// Downloads all remote product/wallpaper images into backend/public/img and
// repoints product.imageUrl in the DB to the locally-hosted backend URL, so TVs
// never depend on an external CDN (which the emulator/hotel network may not reach).
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public', 'img');
const BASE = process.env.PUBLIC_BASE_URL || 'http://10.0.2.2:3000';

const prisma = new PrismaClient();

function nameFromUrl(url) {
  const path = url.split('?')[0];
  const last = path.substring(path.lastIndexOf('/') + 1);
  return (last || 'img').replace(/[^a-zA-Z0-9._-]/g, '_') + (last.includes('.') ? '' : '.jpg');
}

async function download(url, destDir, destName) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(destDir, { recursive: true });
  await writeFile(join(destDir, destName), buf);
  return buf.length;
}

const WALLPAPERS = [
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1280&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1280&q=80',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1280&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1280&q=80',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1280&q=80',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1280&q=80',
];

async function main() {
  // ── Food images ──
  const products = await prisma.product.findMany();
  let okFood = 0;
  for (const p of products) {
    if (!p.imageUrl || !p.imageUrl.startsWith('http') || p.imageUrl.includes('/img/foods/')) continue;
    const name = nameFromUrl(p.imageUrl);
    try {
      const bytes = await download(p.imageUrl, join(PUBLIC, 'foods'), name);
      await prisma.product.update({
        where: { id: p.id },
        data: { imageUrl: `${BASE}/img/foods/${name}` },
      });
      okFood++;
      console.log(`food ✓ ${p.name} (${bytes}b) -> ${name}`);
    } catch (e) {
      console.error(`food ✗ ${p.name}: ${e.message}`);
    }
  }

  // ── Wallpapers ──
  let okWall = 0;
  for (const url of WALLPAPERS) {
    const name = nameFromUrl(url);
    try {
      const bytes = await download(url, join(PUBLIC, 'walls'), name);
      okWall++;
      console.log(`wall ✓ (${bytes}b) -> ${name}`);
    } catch (e) {
      console.error(`wall ✗ ${url}: ${e.message}`);
    }
  }

  console.log(`\nDone. Food: ${okFood}/${products.length}, Wallpapers: ${okWall}/${WALLPAPERS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
