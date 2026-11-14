import initial from '../data/travel-times.json';
import spots from '../data/spots.json';
import books from '../data/books.json';
import {isValidDate} from './date';
import type {Day,Endpoint,Mode,TravelTime} from '../types';
export const STORAGE_KEY='booktrip-travel-times-v1';
export const MASTER_UPDATED_EVENT='booktrip:travel-times-updated';
const modes=['walking','driving','transit'];
const modeNames:Record<Mode,string>={walking:'徒歩',driving:'自動車',transit:'公共交通機関'};
export function validRecord(v:unknown):v is TravelTime {
 if(!v||typeof v!=='object')return false;const r=v as TravelTime;
 return typeof r.id==='string'&&typeof r.fromSpotId==='string'&&typeof r.toSpotId==='string'&&(r.bookId===undefined||typeof r.bookId==='string')&&modes.includes(r.travelMode)&&(r.durationMinutes===null||(Number.isSafeInteger(r.durationMinutes)&&r.durationMinutes>=0))&&['verified','unverified'].includes(r.verificationStatus)&&(r.checkedAt===null||typeof r.checkedAt==='string')&&(r.sourceUrl===null||typeof r.sourceUrl==='string')&&(r.fromPlaceName===undefined||typeof r.fromPlaceName==='string')&&(r.toPlaceName===undefined||typeof r.toPlaceName==='string');
}
// Legacy records without bookId are attributable only when their spot IDs identify one book.
export function recordBookId(record:TravelTime):string|undefined {
 if(record.bookId)return record.bookId;
 const owners=books.filter(book=>[record.fromSpotId,record.toSpotId].some(id=>id&&book.spotIds.includes(id)));
 return owners.length===1?owners[0].id:undefined;
}
export function endpointKey(id:string,name?:string):string {
 if(id)return JSON.stringify(['id',id]);
 const value=name?.trim()??'';
 const spot=spots.find(s=>s.name===value||`${s.name} ${s.address}`===value);
 return JSON.stringify(spot?['id',spot.id]:['name',value]);
}
export function endpointMatches(endpoint:Endpoint,id:string,name?:string){
 return endpointKey(endpoint.id??'',endpoint.name)===endpointKey(id,name);
}
export function recordRequirements(record:TravelTime):string[]{
 const missing:string[]=[];
 const owner=books.find(b=>b.id===recordBookId(record));
 if(!owner)missing.push('作品が未設定、または作品IDが無効です');
 for(const [id,name,label] of [[record.fromSpotId,record.fromPlaceName,'出発地点'],[record.toSpotId,record.toPlaceName,'到着地点']] as const){
  if(!id&&!name?.trim())missing.push(`${label}が未入力です`);
  if(id&&!spots.some(s=>s.id===id))missing.push(`${label}のスポットIDが無効です`);
  else if(id&&owner&&!owner.spotIds.includes(id))missing.push(`${label}が登録作品の候補地と一致しません`);
 }
 if(record.verificationStatus!=='verified')missing.push('確認状態が未確認です（実際に確認後「確認済み」に変更）');
 if(!isValidDate(record.checkedAt))missing.push(record.checkedAt?'確認日が正しい日付ではありません':'確認日が未入力です');
 if(record.durationMinutes===null)missing.push('移動時間が未入力です');
 else if(!Number.isSafeInteger(record.durationMinutes)||record.durationMinutes<0)missing.push('移動時間は0以上の整数で入力してください');
 return missing;
}
export function validateMaster(records:TravelTime[]):string[]{
 const errors:string[]=[];const keys=new Set<string>();
 records.forEach((record,index)=>{
  const prefix=`区間${index+1}`;
  if(!validRecord(record)){errors.push(`${prefix}：データ形式が正しくありません`);return;}
  if(record.verificationStatus==='verified'){
   const missing=recordRequirements(record);if(missing.length)errors.push(`${prefix}：${missing.join('／')}`);
   const key=JSON.stringify([recordBookId(record),endpointKey(record.fromSpotId,record.fromPlaceName),endpointKey(record.toSpotId,record.toPlaceName),record.travelMode]);
   if(keys.has(key))errors.push(`${prefix}：同じ作品・出発地点・到着地点・交通手段の確認済み区間が重複しています`);
   keys.add(key);
  }
  if(record.sourceUrl){try{if(!['http:','https:'].includes(new URL(record.sourceUrl).protocol))throw Error();}catch{errors.push(`${prefix}：出典URLはhttpまたはhttpsで入力してください`);}}
 });
 return errors;
}
export type MasterSnapshot={records:TravelTime[];source:'browser'|'bundled';message:string};
export function loadMasterSnapshot(storage?:Pick<Storage,'getItem'>):MasterSnapshot {
 try{
  const saved=(storage??localStorage).getItem(STORAGE_KEY);
  if(saved!==null){const parsed:unknown=JSON.parse(saved);if(Array.isArray(parsed)&&parsed.every(validRecord))return {records:parsed,source:'browser',message:`保存済みマスタを読み込みました（確認条件を満たす：${parsed.filter(r=>recordRequirements(r).length===0).length}区間）。`};
   return {records:initial as TravelTime[],source:'bundled',message:'保存済みマスタのデータ形式が正しくないため読み込めません。初期データを使用しています。管理ツールで内容を確認してください。'};
  }
  return {records:initial as TravelTime[],source:'bundled',message:'この保存領域には保存済みマスタがありません。管理ツールで保存してください。別のHTML・保存場所・ブラウザのデータは引き継がれない場合があります。'};
 }catch{return {records:initial as TravelTime[],source:'bundled',message:'保存領域を読み込めないか、保存データが壊れています。初期データを使用しています。'};}
}
export function loadMaster():TravelTime[]{return loadMasterSnapshot().records;}
export function saveMaster(records:TravelTime[],storage?:Pick<Storage,'getItem'|'setItem'>,notify?:()=>void){
 const errors=validateMaster(records);if(errors.length)throw new Error(errors.join('\n'));
 const target=storage??localStorage;const json=JSON.stringify(records);target.setItem(STORAGE_KEY,json);
 if(target.getItem(STORAGE_KEY)!==json)throw new Error('保存したデータを読み戻せませんでした');
 if(notify)notify();else if(typeof window!=='undefined')window.dispatchEvent(new Event(MASTER_UPDATED_EVENT));
}
export type MasterMatch={minutes:number|null;code:'matched'|'missing_endpoint'|'other_book'|'no_segment'|'reverse_only'|'mode_mismatch'|'incomplete'|'duplicate';reason:string};
export function matchMaster(records:TravelTime[],from:Endpoint,to:Endpoint,mode:Mode,bookId?:string):MasterMatch {
 const no=(code:MasterMatch['code'],reason:string):MasterMatch=>({minutes:null,code,reason});
 if(!from.query.trim()||!to.query.trim())return no('missing_endpoint','出発地点または到着地点が未入力です。旅行条件で地点を指定してください。');
 const sameBook=(r:TravelTime)=>!bookId||recordBookId(r)===bookId;
 const directed=records.filter(r=>endpointMatches(from,r.fromSpotId,r.fromPlaceName)&&endpointMatches(to,r.toSpotId,r.toPlaceName));
 const scoped=directed.filter(sameBook);
 if(!scoped.length){
  if(directed.length)return no('other_book','同じ地点の登録はありますが、作品が一致しないか作品が未設定です。管理ツールで旅行者画面と同じ作品を選んでください。');
  if(records.some(r=>sameBook(r)&&endpointMatches(to,r.fromSpotId,r.fromPlaceName)&&endpointMatches(from,r.toSpotId,r.toPlaceName)))return no('reverse_only','逆方向の区間だけが登録されています。この方向の移動時間を登録してください。');
  return no('no_segment','この出発地点 → 到着地点の登録がありません。管理ツールで同じ地点・表記の区間を追加してください。');
 }
 const candidates=scoped.filter(r=>r.travelMode===mode);
 if(!candidates.length)return no('mode_mismatch',`旅程の交通手段「${modeNames[mode]}」の登録がありません（登録済み：${[...new Set(scoped.map(r=>modeNames[r.travelMode]))].join('・')}）。同じ交通手段の区間を登録してください。`);
 const eligible=candidates.filter(r=>recordRequirements(r).length===0);
 if(eligible.length>1)return no('duplicate','同じ条件の確認済み区間が重複しているため反映できません。管理ツールで重複を解消してください。');
 if(eligible.length===1)return {minutes:eligible[0].durationMinutes,code:'matched',reason:`確認日：${eligible[0].checkedAt}／交通手段：${modeNames[mode]}`};
 return no('incomplete',`該当する登録はありますが自動反映できません：${[...new Set(candidates.flatMap(recordRequirements))].join('／')}。`);
}
export function lookupMaster(records:TravelTime[],from:Endpoint,to:Endpoint,mode:Mode,bookId?:string):number|null {
 return matchMaster(records,from,to,mode,bookId).minutes;
}
export function applyMasterToDays(days:Day[],records:TravelTime[]):Day[]{
 return days.map(day=>({...day,legs:day.legs.map(leg=>{
  if(leg.source==='manual')return leg;
  const match=matchMaster(records,leg.from,leg.to,leg.mode,leg.bookId);
  return {...leg,minutes:match.minutes,source:match.minutes===null?'unknown':'master',masterReason:match.reason};
 })}));
}
