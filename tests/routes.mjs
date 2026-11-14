import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import http from 'node:http';
const standalone=process.argv.includes('--standalone');
let server;
let base=process.env.BOOKTRIP_TEST_URL||'http://127.0.0.1:5174';
if(standalone){const html=await fs.readFile('work/windows-release/BookTrip.html');server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}/BookTrip.html`;}
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
const results=[];const errors=[];
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:1000},...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'}:{})});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('.book-card').first().click();await page.getByLabel('出発地 必須').fill('松山駅');
  for(const duration of ['半日','1日','2日']){
   await page.getByRole('button',{name:duration,exact:true}).click();
   if(duration==='2日'){await page.getByLabel('宿泊先（任意）').fill('宿泊先');await page.getByLabel('Day 2の出発地（宿泊先）').fill('宿泊先');}
   await page.getByRole('button',{name:'旅程を作成する'}).click();
   const links=page.locator('.route-panel a');const expected=duration==='2日'||(mobile&&duration==='1日')?2:1;
   await expect(links).toHaveCount(expected);
   const panels=page.locator('.route-panel');
   for(let i=0;i<await panels.count();i++){
    const panel=panels.nth(i);const routes=await panel.locator('a').evaluateAll(as=>as.map(a=>({text:a.textContent,href:a.href})));
    for(const route of routes){const u=new URL(route.href);assert.equal(u.searchParams.get('api'),'1');assert.ok((u.searchParams.get('waypoints')?.split('|').length??0)<=(mobile?3:9));assert.ok(!/（\d+\/\d+）/.test(route.text));}
    if(routes.length===1)assert.equal(routes[0].text,'Google Mapsで経路を見る');
    if(routes.length===2){assert.equal(routes[0].text,'前半：松山駅 → 松山城');assert.equal(routes[1].text,'後半：松山城 → 松山駅');assert.equal(new URL(routes[0].href).searchParams.get('destination'),new URL(routes[1].href).searchParams.get('origin'));}
   }
   if(mobile){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(duration==='1日')await page.screenshot({path:`work/routes-${standalone?'standalone':'web'}-mobile.png`,fullPage:true});}
   // Resize the desktop one-day view to ensure its link count follows the responsive layout.
   if(!mobile&&duration==='1日'){await page.setViewportSize({width:390,height:844});await expect(links).toHaveCount(2);await page.setViewportSize({width:1366,height:1000});await expect(links).toHaveCount(1);}
   results.push(`${standalone?'standalone':'web'} ${mobile?'mobile':'desktop'} ${duration}`);
   await page.getByRole('button',{name:'旅行条件に戻る'}).click();
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(`work/routes-${standalone?'standalone':'web'}-results.json`,JSON.stringify({checks:results,errors},null,2));console.log('PASS',results.join('\nPASS '));
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
