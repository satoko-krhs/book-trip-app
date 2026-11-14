import test from 'node:test';
import assert from 'node:assert/strict';
import books from '../data/books.json';
import {createDays} from './itinerary';
import {placeEndpoint,routeLinks,routeLabel,spotEndpoint,waypointLimit} from './maps';
import type {Duration,Mode,Settings} from '../types';
const settings:Settings={bookId:'botchan',origin:'松山駅',destination:'松山駅',duration:'one',startTime:'08:00',day1End:'宿泊先',day2Start:'宿泊先',day2Time:'09:00',mode:'transit'};
function decoded(url:string){const p=new URL(url).searchParams;return [p.get('origin')!,...(p.get('waypoints')?.split('|')??[]),p.get('destination')!];}
test('all books and durations preserve every route edge for desktop/mobile and every mode',()=>{
 for(const book of books)for(const duration of ['half','one','two'] as Duration[])for(const mode of ['walking','driving','transit'] as Mode[])for(const limit of [3,9]){
  for(const day of createDays(book,{...settings,duration,mode},[])){
   const points=[day.origin,...day.spots.map(spotEndpoint),day.destination];
   const links=routeLinks(points,mode,limit);
   assert.equal(links.length,duration==='one'&&limit===3?2:1,`${book.id}/${duration}/${mode}/${limit}`);
   const joined:string[]=[];
   links.forEach((link,i)=>{
    const queries=decoded(link.url);const u=new URL(link.url);
    assert.equal(u.origin,'https://www.google.com');assert.equal(u.searchParams.get('api'),'1');assert.equal(u.searchParams.get('travelmode'),mode);assert.equal(u.searchParams.has('key'),false);
    assert.ok(queries.length-2<=limit);assert.ok(link.url.length<=2048);
    assert.equal(link.from.query,queries[0]);assert.equal(link.to.query,queries.at(-1));
    if(i){assert.equal(decoded(links[i-1].url).at(-1),queries[0]);joined.push(...queries.slice(1));}else joined.push(...queries);
   });
   assert.deepEqual(joined,points.map(p=>p.query));
  }
 }
});
test('single route has one button; split labels name the real shared facility',()=>{
 const day=createDays(books[0],settings,[])[0];const points=[day.origin,...day.spots.map(spotEndpoint),day.destination];
 const desktop=routeLinks(points,'transit',9);assert.equal(routeLabel(desktop[0],0,1),'Google Mapsで経路を見る');
 const mobile=routeLinks(points,'transit',3);assert.equal(routeLabel(mobile[0],0,2),'前半：松山駅 → 松山城');assert.equal(routeLabel(mobile[1],1,2),'後半：松山城 → 松山駅');
});
test('waypoint limits use mobile browser or compact layout conservatively',()=>{
 assert.equal(waypointLimit('Windows NT 10.0; Win64; ARM64',false),9);
 assert.equal(waypointLimit('Mozilla/5.0 (iPhone)',false),3);
 assert.equal(waypointLimit('Mozilla/5.0 (Linux; Android 14)',false),3);
 assert.equal(waypointLimit('Desktop',true),3);
});
test('boundary counts and more than two sections preserve the full order',()=>{
 for(const limit of [3,9])for(const count of [2,5,6,11,12,24]){
  const points=Array.from({length:count},(_,i)=>placeEndpoint(`地点${i}`));const links=routeLinks(points,'walking',limit);
  assert.equal(links.length,Math.ceil((count-1)/(limit+1)));
  const joined=links.flatMap((link,i)=>decoded(link.url).slice(i?1:0));assert.deepEqual(joined,points.map(p=>p.query));
  if(links.length>2)assert.equal(routeLabel(links[1],1,links.length),`区間2：${links[1].from.name} → ${links[1].to.name}`);
 }
});
test('missing lodging never generates a partial misleading route',()=>{
 assert.deepEqual(routeLinks([placeEndpoint(''),placeEndpoint('松山城'),placeEndpoint('駅')],'transit',9),[]);
 assert.deepEqual(routeLinks([placeEndpoint('駅')],'transit',9),[]);
});
