import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('./', import.meta.url);
const allowed = new Set(['index.html','style.css','app.js','game.js','worm.svg','manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png']);
http.createServer(async (req,res) => {
  const path = new URL(req.url,'http://localhost').pathname.slice(1) || 'index.html';
  if (!allowed.has(path)) {res.writeHead(404);res.end();return;}
  try {const body = await readFile(fileURLToPath(new URL(path,root)));res.writeHead(200,{'Content-Type':path.endsWith('.png')?'image/png':path.endsWith('.svg')?'image/svg+xml':path.endsWith('.webmanifest')?'application/manifest+json':path.endsWith('.css')?'text/css':path.endsWith('.js')?'text/javascript':'text/html; charset=utf-8'});res.end(body);} catch {res.writeHead(500);res.end();}
}).listen(Number(process.env.PORT)||5173,'0.0.0.0',()=>console.log('HECK running on port '+(process.env.PORT||5173)));
