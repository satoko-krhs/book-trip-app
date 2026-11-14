import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {existsSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
const html=await fs.readFile(path.resolve('work/windows-release/BookTrip.html'));
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const context=await browser.newContext({viewport:{width:1366,height:1000}});
const page=await context.newPage();const errors=[],requests=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.isNavigationRequest())requests.push(r.url());});
const check=name=>{checks.push(name);console.log('PASS',name);};
const file=`http://127.0.0.1:${server.address().port}/BookTrip.html`;
try{
 await page.goto(file);await page.getByRole('heading',{name:/本の世界を、.*旅しよう。/}).waitFor();assert.equal(await page.locator('.book-card').count(),3);await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));assert.equal(requests.length,0);check('standalone HTML opens over HTTP, 3 embedded photographs, no asset requests');await context.setOffline(true);
 await page.locator('.book-card').first().click();await page.getByLabel('出発地 必須').fill('松山駅');await page.getByRole('button',{name:'旅程を作成する'}).click();assert.equal(await page.locator('.spot-card').count(),4);assert.match(await page.locator('.summary').innerText(),/未確定/);for(const input of await page.locator('.minutes-label input').all())await input.fill('10');assert.match(await page.locator('.summary').innerText(),/13:05/);await page.getByRole('button',{name:'道後温泉本館の滞在時間を15分増やす'}).click();assert.match(await page.locator('.summary').innerText(),/13:20/);check('offline itinerary generation and live stay/travel recalculation');
 assert.equal(await page.locator('.route-panel a').count(),2);assert.ok((await page.locator('.route-panel a').first().getAttribute('href')).startsWith('https://www.google.com/maps/dir/?api=1'));check('Google Maps links retain API-key-free directions');
 await context.setOffline(false);await page.getByRole('link',{name:'管理ツール',exact:true}).click();await page.getByRole('heading',{name:'移動時間マスタ登録ツール'}).waitFor();assert.ok(page.url().endsWith('#/admin/travel-times'));await page.reload();await page.getByRole('heading',{name:'移動時間マスタ登録ツール'}).waitFor();check('standalone hash-route admin navigation and reload');
 const row=page.locator('.admin-record').first();await row.getByLabel('所要時間（分）').fill('12');await row.getByLabel('確認日').fill('2026-11-14');await row.getByLabel('確認状態').selectOption('verified');await page.getByRole('button',{name:'このブラウザに登録'}).click();await page.getByRole('status').waitFor();assert.match(await page.getByRole('status').innerText(),/登録しました/);await page.reload();assert.equal(await page.locator('.admin-record').first().getByLabel('所要時間（分）').inputValue(),'12');
 const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'JSONをダウンロード'}).click();const download=await downloading;const data=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(data[0].durationMinutes,12);check('browser storage persists and JSON downloads');
 await page.getByRole('link',{name:'BookTripに戻る',exact:true}).click();await page.getByRole('heading',{name:/本の世界を、.*旅しよう。/}).waitFor();await page.locator('.book-card').first().click();await page.getByLabel('出発地 必須').fill('松山駅');await page.getByRole('button',{name:'旅程を作成する'}).click();assert.equal(await page.locator('.minutes-label input').nth(1).inputValue(),'12');check('return to planner and apply saved verified master');
 await page.getByRole('button',{name:'旅行条件に戻る'}).click();await page.getByRole('button',{name:'2日',exact:true}).click();await page.getByLabel('Day 1の最終目的地').fill('宿泊先');await page.getByLabel('Day 2の出発地（宿泊先）').fill('宿泊先');await page.getByRole('button',{name:'旅程を作成する'}).click();assert.equal(await page.locator('.day-section').count(),2);assert.equal(await page.locator('.route-panel a').count(),2);check('standalone two-day plan with separate routes');
 await page.goto(file);await page.setViewportSize({width:390,height:844});await page.getByRole('heading',{name:/本の世界を、.*旅しよう。/}).waitFor();await page.screenshot({path:'work/standalone-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.equal(requests.length,0);check('mobile layout, no runtime errors, no external asset requests');
 await fs.writeFile('work/standalone-results.json',JSON.stringify({passed:checks.length,checks,errors,externalRequests:requests,mode:'HTTP standalone HTML; offline itinerary edits; Chromium',fileUrlBlockedByManagedBrowser:true,windowsEdgeTested:false},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
