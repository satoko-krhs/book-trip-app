import test from 'node:test';
import assert from 'node:assert/strict';
import books from '../data/books.json';
import type {Settings,TravelTime} from '../types';
import {applyMasterToDays,lookupMaster} from './master';
import {createDays,day1FinalSpot,dayRoutePoints,scheduleDay} from './itinerary';
import {placeEndpoint,spotEndpoint} from './maps';
import {addCalendarDays,isValidDate} from './date';
import {createMapsRoute,departureText} from './routing';
const settings:Settings={bookId:'botchan',origin:'松山駅',destination:'松山駅',travelDate:'2026-12-31',duration:'two',startTime:'08:00',day1End:'',day2Start:'',day2Time:'09:00',mode:'transit'};
const record:TravelTime={id:'sample',bookId:'botchan',fromSpotId:'',toSpotId:'dogo-onsen',fromPlaceName:'松山駅',travelMode:'transit',durationMinutes:25,checkedAt:'2026-11-14',sourceUrl:null,verificationStatus:'verified'};
test('master updates apply to an existing plan, preserving stays and manual values including cleared input',()=>{
 const days=createDays(books[0],{...settings,duration:'one'},[]);
 days[0].stays[0]=105;
 const next={...record,id:'second',fromSpotId:'dogo-onsen',toSpotId:'dogo-park',durationMinutes:12};
 let updated=applyMasterToDays(days,[record,next]);assert.equal(updated[0].legs[0].minutes,25);assert.equal(updated[0].legs[1].minutes,12);assert.equal(updated[0].legs[0].source,'master');assert.equal(updated[0].stays[0],105);assert.equal(scheduleDay(updated[0]).visits[1].arrival,622);
 updated[0].legs[1]={...updated[0].legs[1],source:'manual',minutes:9};
 updated=applyMasterToDays(updated,[{...record,durationMinutes:30},{...next,durationMinutes:99}]);assert.equal(updated[0].legs[0].minutes,30);assert.equal(updated[0].legs[1].minutes,9);assert.equal(updated[0].legs[1].source,'manual');
 updated[0].legs[1].minutes=null;updated=applyMasterToDays(updated,[record,next]);assert.equal(updated[0].legs[1].minutes,null);
 updated=applyMasterToDays(updated,[{...record,verificationStatus:'unverified'},next]);assert.equal(updated[0].legs[0].minutes,null);assert.equal(updated[0].legs[0].source,'unknown');assert.equal(scheduleDay(updated[0]).visits[0].arrival,null);
});
test('master requires verified, valid date, integer time; matches direction, mode, IDs and exact names',()=>{
 const from=placeEndpoint('松山駅'),to=spotEndpoint(createDays(books[0],settings,[])[0].spots[0]);
 assert.equal(lookupMaster([record],from,to,'transit'),25);
 assert.equal(lookupMaster([{...record,durationMinutes:0}],from,to,'transit'),0);
 for(const patch of [{verificationStatus:'unverified' as const},{checkedAt:null},{checkedAt:''},{checkedAt:'2026-02-30'},{durationMinutes:null},{durationMinutes:1.5},{durationMinutes:-1}])assert.equal(lookupMaster([{...record,...patch}],from,to,'transit'),null);
 assert.equal(lookupMaster([record],to,from,'transit'),null);assert.equal(lookupMaster([record],from,to,'walking'),null);
 assert.equal(lookupMaster([{...record,toSpotId:'',toPlaceName:'道後温泉本館'}],from,to,'transit'),25);
 assert.equal(lookupMaster([record],from,placeEndpoint('道後温泉本館'),'transit'),25);
});
test('all books: default Day 1 ends at its last tourist spot without duplicate destination or synthetic leg',()=>{
 for(const book of books){
  const days=createDays(book,settings,[]),day=days[0];assert.equal(day.destination.id,book.spotIds[1]);assert.equal(day.legs.length,2);assert.equal(day1FinalSpot(book).id,book.spotIds[1]);
  const points=dayRoutePoints(day);assert.equal(points.length,3);assert.equal(points.filter(p=>p.id===day.destination.id).length,1);assert.equal(days[1].origin.name,'');
  day.legs.forEach(l=>l.minutes=10);assert.equal(scheduleDay(day).end,480+20+day.stays.reduce((a,b)=>a+b,0));
  const reordered={...book,spotIds:[book.spotIds[1],book.spotIds[0],...book.spotIds.slice(2)]};assert.equal(createDays(reordered,settings,[])[0].destination.id,book.spotIds[0]);
 }
});
test('lodging adds a final leg, while other durations return to the requested goal',()=>{
 const days=createDays(books[0],{...settings,day1End:'道後の宿',day2Start:'道後の宿'},[]);
 assert.equal(days[0].destination.name,'道後の宿');assert.equal(days[0].endsAtLastSpot,false);assert.equal(days[0].legs.length,3);assert.equal(days[0].legs.at(-1)!.from.name,'道後公園');assert.equal(days[0].legs.at(-1)!.to.name,'道後の宿');assert.equal(days[1].origin.name,'道後の宿');assert.equal(dayRoutePoints(days[0]).filter(p=>p.id==='dogo-park').length,1);
 for(const duration of ['half','one'] as const)assert.equal(createDays(books[0],{...settings,duration},[])[0].destination.name,'松山駅');
});
test('date rollover and Maps adapter expose departure for display only, never unsupported URL parameters',()=>{
 assert.equal(addCalendarDays('2026-12-31',1),'2027-01-01');assert.equal(addCalendarDays('2028-02-28',1),'2028-02-29');assert.equal(isValidDate('2026-02-30'),false);
 const day=createDays(books[0],settings,[])[0];
 const route=createMapsRoute({points:dayRoutePoints(day),mode:'transit',maxWaypoints:9,departure:{date:settings.travelDate,time:'08:00',timeZone:'Asia/Tokyo'}});
 assert.equal(route.supportsDepartureTime,false);assert.equal(departureText(route.departure),'2026/12/31 08:00（日本時間）');
 assert.deepEqual([...new URL(route.links[0].url).searchParams.keys()].sort(),['api','destination','origin','travelmode','waypoints']);
});
