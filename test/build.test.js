import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,copyFile,readFile,appendFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {build,files} from '../build.js';
test('配信ファイルが変わればworkerも更新され、同一ビルドは同じ版になる',async()=>{
 const root=await mkdtemp(join(tmpdir(),'heck-build-'));
 try{
  await Promise.all([...files,'sw.js'].map(name=>copyFile(new URL('../'+name,import.meta.url),join(root,name))));
  const first=await build(root);assert.equal(await build(root),first);
  await appendFile(join(root,'style.css'),'\n/* updated release */');
  const second=await build(root);assert.notEqual(first,second);
  const worker=await readFile(join(root,'_site','sw.js'),'utf8');assert.ok(worker.includes(second));assert.ok(!worker.includes('__BUILD_VERSION__'));
  assert.equal(await readFile(join(root,'_site','style.css'),'utf8'),await readFile(join(root,'style.css'),'utf8'));
 }finally{await rm(root,{recursive:true,force:true});}
});
