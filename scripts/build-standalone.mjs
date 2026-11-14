import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const outputDir=path.resolve(root,'work/windows-release');
await fs.mkdir(outputDir,{recursive:true});
const result=await build({
 entryPoints:['src/main.tsx'],bundle:true,minify:true,format:'iife',platform:'browser',target:['es2022'],
 jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},write:false,
 outfile:path.join(outputDir,'standalone.js'),legalComments:'inline',
 plugins:[{name:'inline-book-photographs',setup(builder){
  builder.onLoad({filter:/[/\\]src[/\\]data[/\\]books\.json$/},async args=>{
   const books=JSON.parse(await fs.readFile(args.path,'utf8'));
   for(const book of books){
    if(book.imageUrl?.startsWith('/images/')){
     const image=await fs.readFile(path.join(root,'public',book.imageUrl));
     book.imageUrl=`data:image/jpeg;base64,${image.toString('base64')}`;
    }
   }
   return {contents:JSON.stringify(books),loader:'json'};
  });
 }}]
});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text;
// Use the platform's Japanese fonts so this distribution works without font downloads.
const css=result.outputFiles.find(f=>f.path.endsWith('.css')).text.replace(/@import\s*(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;/g,'');
const html=`<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="booktrip-standalone" content="true"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#263f50"><title>BookTrip｜Windows配布版</title><style>${css.replaceAll('</style','<\\/style')}</style></head><body><div id="root"></div><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`;
await fs.writeFile(path.join(outputDir,'BookTrip.html'),html);
await fs.copyFile('THIRD-PARTY-NOTICES.txt',path.join(outputDir,'THIRD-PARTY-NOTICES.txt'));
console.log(`Created ${path.join(outputDir,'BookTrip.html')} (${Buffer.byteLength(html)} bytes)`);
