import test from 'node:test';
import assert from 'node:assert/strict';
import type {Settings,TravelTime} from '../types';
import {applyMasterToDays,loadMasterSnapshot,matchMaster,recordBookId,recordRequirements,saveMaster,STORAGE_KEY,validateMaster} from './master';
import {createDays,scheduleDay} from './itinerary';
import {placeEndpoint} from './maps';
import books from '../data/books.json';
const record:TravelTime={id:'test',bookId:'botchan',fromSpotId:'',fromPlaceName:'松山駅',toSpotId:'dogo-onsen',travelMode:'transit',durationMinutes:25,checkedAt:'2026-11-14',verificationStatus:'verified',sourceUrl:null};
function memory(){const data=new Map<string,string>();return {data,getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};}
const settings:Settings={bookId:'botchan',origin:'松山駅',destination:'松山駅',duration:'one',startTime:'08:00',travelDate:'2026-11-14',day1End:'',day2Start:'',day2Time:'09:00',mode:'transit'};
test('save/read/apply uses the same key, persists checked data, and recalculates an existing plan',()=>{
 const storage=memory();let events=0;saveMaster([record],storage,()=>events++);
 assert.equal(events,1);assert.deepEqual([...storage.data.keys()],[STORAGE_KEY]);assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)!),[record]);
 const loaded=loadMasterSnapshot(storage);assert.equal(loaded.source,'browser');
 const days=createDays(books[0],settings,[]);const updated=applyMasterToDays(days,loaded.records);assert.equal(updated[0].legs[0].minutes,25);assert.equal(updated[0].legs[0].source,'master');assert.equal(scheduleDay(updated[0]).visits[0].arrival,505);
 updated[0].legs[0]={...updated[0].legs[0],source:'manual',minutes:7};saveMaster([{...record,durationMinutes:40}],storage,()=>events++);assert.equal(applyMasterToDays(updated,loadMasterSnapshot(storage).records)[0].legs[0].minutes,7);
});
test('incomplete verified records are rejected before writing, while unverified drafts remain unverified and do not apply',()=>{
 const storage=memory();saveMaster([record],storage,()=>{});const before=storage.getItem(STORAGE_KEY);
 assert.throws(()=>saveMaster([{...record,checkedAt:null}],storage,()=>{}),/確認日/);assert.equal(storage.getItem(STORAGE_KEY),before);
 const draft={...record,verificationStatus:'unverified' as const,checkedAt:null};saveMaster([draft],storage,()=>{});const loaded=loadMasterSnapshot(storage).records;assert.equal(loaded[0].verificationStatus,'unverified');
 const leg=createDays(books[0],settings,loaded)[0].legs[0];assert.equal(leg.minutes,null);assert.match(leg.masterReason!,/未確認/);assert.match(leg.masterReason!,/確認日/);assert.ok(recordRequirements(draft).length>=2);
});
test('bookId, direction, mode, verification, date, missing endpoints, and missing segments each have a specific reason',()=>{
 const from=placeEndpoint('松山駅'),to=placeEndpoint('道後温泉本館');
 assert.equal(matchMaster([record],from,to,'transit','botchan').code,'matched');
 assert.equal(matchMaster([record],from,to,'transit','koto').code,'other_book');
 assert.equal(matchMaster([record],from,to,'walking','botchan').code,'mode_mismatch');
 assert.equal(matchMaster([record],to,from,'transit','botchan').code,'reverse_only');
 assert.equal(matchMaster([record],from,placeEndpoint('別の場所'),'transit','botchan').code,'no_segment');
 assert.equal(matchMaster([record],placeEndpoint(''),to,'transit','botchan').code,'missing_endpoint');
 assert.equal(matchMaster([{...record,verificationStatus:'unverified'}],from,to,'transit','botchan').code,'incomplete');
 assert.match(matchMaster([{...record,checkedAt:null}],from,to,'transit','botchan').reason,/確認日/);
 assert.equal(matchMaster([record,{...record,id:'duplicate'}],from,to,'transit','botchan').code,'duplicate');
});
test('same free-text endpoints may have separate book-specific masters; duplicates within a book are rejected',()=>{
 const free={...record,toSpotId:'',toPlaceName:'宿泊先'};const other={...free,id:'koto-record',bookId:'koto',durationMinutes:50};
 assert.deepEqual(validateMaster([free,other]),[]);assert.ok(validateMaster([free,{...free,id:'duplicate'}]).some(s=>s.includes('重複')));
 const to=placeEndpoint('宿泊先');assert.equal(matchMaster([free,other],placeEndpoint('松山駅'),to,'transit','botchan').minutes,25);assert.equal(matchMaster([free,other],placeEndpoint('松山駅'),to,'transit','koto').minutes,50);
 assert.ok(recordRequirements({...record,bookId:'koto'}).some(s=>s.includes('候補地')));
});
test('legacy spot IDs can identify the book, but free-text-only legacy records are not guessed',()=>{
 assert.equal(recordBookId({...record,bookId:undefined}),'botchan');
 const unknown={...record,bookId:undefined,toSpotId:'',toPlaceName:'宿泊先'};assert.equal(recordBookId(unknown),undefined);assert.match(recordRequirements(unknown).join(' '),/作品/);
});
test('storage failures are surfaced without a success event; malformed saved data is not silently presented as saved',()=>{
 let notified=false;const broken={getItem:()=>null,setItem:()=>{throw Error('denied');}};
 assert.throws(()=>saveMaster([record],broken,()=>{notified=true;}),/denied/);assert.equal(notified,false);
 const storage=memory();storage.setItem(STORAGE_KEY,'{invalid');assert.equal(loadMasterSnapshot(storage).source,'bundled');assert.match(loadMasterSnapshot(storage).message,/壊れ|読み込/);
 storage.setItem(STORAGE_KEY,JSON.stringify([{id:'malformed'}]));assert.match(loadMasterSnapshot(storage).message,/データ形式/);
});

test('a saved internal leg alone cannot infer arrival until the initial journey leg is supplied',()=>{
 const internal={...record,id:'internal',fromSpotId:'dogo-onsen',toSpotId:'dogo-park',durationMinutes:12};
 const partial=createDays(books[0],settings,[internal]);assert.equal(partial[0].legs[1].minutes,12);assert.equal(partial[0].legs[1].source,'master');assert.equal(scheduleDay(partial[0]).visits[1].arrival,null);
 const complete=applyMasterToDays(partial,[internal,record]);assert.equal(scheduleDay(complete[0]).visits[1].arrival,607);
});
