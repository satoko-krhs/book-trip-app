import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
const standalone=process.argv.includes('--standalone');let server;
let base=process.env.BOOKTRIP_TEST_URL||'http://127.0.0.1:5174';
if(standalone){const html=await fs.readFile('work/windows-release/BookTrip.html');server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}/BookTrip.html`;}
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});const checks=[];
try{
 for(const width of [390,320]){
  const context=await browser.newContext({viewport:{width,height:1000}});const page=await context.newPage();await page.goto(base);await page.locator('.book-card').first().click();await page.getByLabel('出発地 必須').fill('松山駅');await page.getByRole('button',{name:'2日',exact:true}).click();
  await page.addStyleTag({content:'*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}'});
  const verify=async name=>{assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} overflow`);checks.push(`${width} ${name}`);};
  await verify('planner text spacing');await page.getByRole('button',{name:'旅程を作成する'}).click();await verify('itinerary text spacing');await page.getByRole('link',{name:'管理ツール',exact:true}).click();await page.getByRole('heading',{name:'移動時間マスタ登録ツール'}).waitFor();await verify('administrator text spacing');await context.close();
 }
 await fs.writeFile(`work/accessibility-spacing-${standalone?'standalone':'web'}.json`,JSON.stringify({checks},null,2));console.log('PASS',standalone?'standalone':'web','WCAG text spacing:',checks.join(', '));
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
