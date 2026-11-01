import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
export const files=['index.html','style.css','app.js','game.js','worm.png','manifest.webmanifest','icon.svg','icon-180.png','icon-192.png','icon-512.png'];
export async function build(root=dirname(fileURLToPath(import.meta.url)),out=resolve(root,'_site')){
 const contents=await Promise.all(files.map(name=>readFile(resolve(root,name))));
 const worker=await readFile(resolve(root,'sw.js'),'utf8');
 const hash=createHash('sha256');
 files.forEach((name,i)=>{hash.update(name);hash.update(contents[i]);});hash.update(worker);
 const version=hash.digest('hex').slice(0,24);
 await mkdir(out,{recursive:true});
 await Promise.all(files.map((name,i)=>writeFile(resolve(out,name),contents[i])));
 await writeFile(resolve(out,'sw.js'),worker.replace('__BUILD_VERSION__',version));
 return version;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Built release '+await build());
