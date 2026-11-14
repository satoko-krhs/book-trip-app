import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import http from 'node:http';
const standalone=process.argv.includes('--standalone');let server;
let base=process.env.BOOKTRIP_TEST_URL||'http://127.0.0.1:5174';
if(standalone){const html=await fs.readFile('work/windows-release/BookTrip.html');server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}/BookTrip.html`;}
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
const reports=[],manual=[],errors=[];const kind=standalone?'standalone':'web';
const tags=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'];
async function audit(page,name){
 const result=await new AxeBuilder({page}).withTags(tags).analyze();
 const concise=rule=>({id:rule.id,impact:rule.impact,description:rule.description,nodes:rule.nodes.map(n=>({target:n.target,failureSummary:n.failureSummary}))});
 reports.push({name,violations:result.violations.map(concise),incomplete:result.incomplete.map(concise),passes:result.passes.length});await fs.writeFile(`work/accessibility-${kind}-progress.json`,JSON.stringify(reports,null,2));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`horizontal overflow: ${name}`);
 console.log(`${result.violations.length?'FAIL':'PASS'} ${kind} ${name}: ${result.violations.map(v=>v.id).join(',')||'axe violations 0'}`);
}
async function choose(page){await page.locator('.book-card').first().click();await page.getByLabel('出発地 必須').fill('松山駅');}
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.getByRole('heading',{name:/本の世界を、.*旅しよう。/}).waitFor();await audit(page,`${width} planner`);
  if(width!==320){await page.getByRole('button',{name:'旅程を作成する'}).click();await expect(page.getByRole('alert')).toBeFocused();await audit(page,`${width} form-errors`);}
  await choose(page);await page.getByRole('button',{name:'2日',exact:true}).click();await audit(page,`${width} two-day-settings`);await page.getByRole('button',{name:'旅程を作成する'}).click();await page.getByRole('heading',{name:'『坊っちゃん』を巡る旅'}).waitFor();await audit(page,`${width} two-day-itinerary`);
  await page.getByRole('link',{name:'管理ツール',exact:true}).click();await expect(page.getByRole('heading',{name:'移動時間マスタ登録ツール'})).toBeFocused();await audit(page,`${width} admin`);
  if(width!==320){const row=page.locator('.admin-record').first();await row.getByLabel('確認状態').selectOption('verified');await page.getByRole('button',{name:'ブラウザに保存',exact:true}).click();await expect(page.getByRole('alert')).toBeFocused();await audit(page,`${width} admin-errors`);await page.getByRole('link',{name:'旅程に戻る',exact:true}).click();await expect(page.getByRole('heading',{name:'移動時間マスタ登録ツール'})).toBeVisible();await expect(page.getByRole('alert')).toContainText('未保存');await page.getByRole('button',{name:'最初の入力エラーへ移動'}).focus();await page.keyboard.press('Enter');await expect(row.getByLabel('所要時間（分）')).toBeFocused();await row.getByLabel('所要時間（分）').fill('12');await row.getByLabel('確認日').fill('2026-11-14');await page.getByRole('button',{name:'ブラウザに保存',exact:true}).click();await expect(page.locator('.export-panel [role="status"]')).toContainText('保存しました');await audit(page,`${width} admin-saved`);}
  if(width===320){await page.getByText('JSONを表示',{exact:true}).click();await audit(page,'320 admin-json-expanded');}
  await page.screenshot({path:`work/ui-${kind}-admin-${width}.png`,fullPage:true});
  await page.getByRole('link',{name:'BookTripに戻る',exact:true}).click();await page.getByRole('heading',{name:'『坊っちゃん』を巡る旅'}).waitFor();await page.screenshot({path:`work/ui-${kind}-itinerary-${width}.png`,fullPage:true});await page.getByRole('button',{name:'旅行条件に戻る'}).click();await page.screenshot({path:`work/ui-${kind}-planner-${width}.png`,fullPage:true});
  if(width===390){
   await page.addStyleTag({content:':root{font-size:200% !important}'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% text size must not cause page overflow');manual.push('200% text size: planner reflows at 390px');await page.getByRole('button',{name:'旅程を作成する'}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% text itinerary');await page.getByRole('link',{name:'管理ツール',exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% text admin');manual.push('200% text size: itinerary and administrator reflow at 390px');
  }
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();await page.goto(base);await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'本文へ移動',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#main-content')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('#book-botchan')).toBeFocused();const outline=await page.locator('#book-botchan').evaluate(e=>({style:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth}));assert.equal(outline.style,'solid');assert.ok(parseFloat(outline.width)>=3);await page.keyboard.press('Space');await expect(page.locator('#book-botchan')).toHaveAttribute('aria-pressed','true');manual.push('keyboard: skip link, card focus outline and Space selection');
 await page.getByRole('button',{name:'旅程を作成する'}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('alert')).toBeFocused();await page.getByRole('button',{name:'出発地を入力してください。',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('#trip-origin')).toBeFocused();await page.keyboard.insertText('松山駅');await expect(page.getByRole('alert')).toHaveCount(0);await page.getByRole('button',{name:'旅程を作成する'}).focus();await page.keyboard.press('Enter');await expect(page.locator('#itinerary-title')).toBeFocused();manual.push('keyboard: error summary, field navigation, live error resolution and generated itinerary focus');
 const smallTargets=await page.locator('button,input,select,summary,a.button,a.admin-link,a.brand,a.text-link').evaluateAll(nodes=>nodes.filter(e=>e.getClientRects().length&&!e.disabled&&getComputedStyle(e).visibility!=='hidden').map(e=>({label:e.getAttribute('aria-label')||e.textContent?.trim()||e.tagName,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})).filter(e=>e.width<24||e.height<24));assert.deepEqual(smallTargets,[]);manual.push('visible interactive controls meet 24px AA target minimum; primary controls use 44px or larger');
 await page.getByRole('link',{name:'管理ツール',exact:true}).click();await expect(page.locator('#admin-title')).toBeFocused();const adminUrl=page.url();await page.getByRole('link',{name:'本文へ移動',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('#main-content')).toBeFocused();assert.equal(page.url(),adminUrl);await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'BookTripに戻る',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#itinerary-title')).toBeFocused();manual.push('keyboard: admin skip link preserves the route and returns to the existing itinerary');await page.emulateMedia({forcedColors:'active'});await page.getByRole('button',{name:'旅行条件に戻る'}).click();const highContrast=await page.locator('.book-card.selected').evaluate(e=>getComputedStyle(e).outlineStyle);assert.equal(highContrast,'solid');manual.push('forced-colors mode retains selected-card outline');await context.close();
 const violations=reports.flatMap(r=>r.violations.map(v=>({page:r.name,...v})));
 const result={kind,scans:reports.length,violations:violations.length,reports,manual,errors,limits:['Windows Edge/ARM64 file:// and NVDA/JAWS/VoiceOver not tested','Automated scans do not prove full WCAG 2.2 AA conformance','320 CSS px approximates 1280px at 400% zoom; actual Windows browser zoom not tested','Google Maps external UI is outside this audit']};
 await fs.writeFile(`work/accessibility-${kind}.json`,JSON.stringify(result,null,2));
 assert.deepEqual(errors,[]);assert.equal(violations.length,0,JSON.stringify(violations.slice(0,8),null,2));console.log('PASS',kind,'keyboard, zoom/reflow, targets and forced colors');
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
