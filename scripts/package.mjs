import {mkdtemp,mkdir,cp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const temp=await mkdtemp(path.join(tmpdir(),'read-from-here-package-'));
const name='Read-from-here';
const output=path.join(root,'artifacts','Read-from-here.zip');
try{
  await mkdir(path.dirname(output),{recursive:true});
  await cp(path.join(root,'extension'),path.join(temp,name),{recursive:true});
  await cp(path.join(root,'docs','INSTALL.md'),path.join(temp,name,'README.md'));
  await cp(path.join(root,'PROVIDERS.md'),path.join(temp,name,'PROVIDERS.md'));
  const manifest=JSON.parse(await readFile(path.join(temp,name,'manifest.json'),'utf8'));
  if(manifest.host_permissions.some(host=>host.includes('127.0.0.1')||host==='<all_urls>'))throw new Error('Refusing to package test-only host permissions.');
  await rm(output,{force:true});
  const zipped=spawnSync('zip',['-q','-r',output,name],{cwd:temp,encoding:'utf8'});
  if(zipped.status!==0)throw new Error(zipped.stderr||'zip command failed.');
  await writeFile(path.join(root,'artifacts','INSTALL.txt'),'Unzip Read-from-here.zip. Open chrome://extensions, turn on Developer mode, choose Load unpacked, and select the unzipped Read-from-here folder. Pin the extension and click it on an article.\n');
  console.log(output);
}finally{await rm(temp,{recursive:true,force:true});}
