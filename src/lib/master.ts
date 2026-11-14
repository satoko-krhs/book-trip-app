import initial from '../data/travel-times.json';
import spots from '../data/spots.json';
import {isValidDate} from './date';
import type {Day,Endpoint,Mode,TravelTime} from '../types';
export const STORAGE_KEY='booktrip-travel-times-v1';
export const MASTER_UPDATED_EVENT='booktrip:travel-times-updated';
const modes=['walking','driving','transit'];
export function validRecord(v:unknown):v is TravelTime {
 if(!v||typeof v!=='object')return false;const r=v as TravelTime;
 return typeof r.id==='string'&&typeof r.fromSpotId==='string'&&typeof r.toSpotId==='string'&&modes.includes(r.travelMode)&&(r.durationMinutes===null||(Number.isSafeInteger(r.durationMinutes)&&r.durationMinutes>=0))&&['verified','unverified'].includes(r.verificationStatus)&&(r.checkedAt===null||typeof r.checkedAt==='string')&&(r.sourceUrl===null||typeof r.sourceUrl==='string')&&(r.fromPlaceName===undefined||typeof r.fromPlaceName==='string')&&(r.toPlaceName===undefined||typeof r.toPlaceName==='string');
}
export function loadMaster():TravelTime[]{try{const saved=localStorage.getItem(STORAGE_KEY);if(saved){const parsed=JSON.parse(saved);if(Array.isArray(parsed)&&parsed.every(validRecord))return parsed;}}catch{/* fall back if browser storage is unavailable */}return initial as TravelTime[];}
export function saveMaster(records:TravelTime[]){
 localStorage.setItem(STORAGE_KEY,JSON.stringify(records));
 window.dispatchEvent(new Event(MASTER_UPDATED_EVENT));
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
export function lookupMaster(records:TravelTime[],from:Endpoint,to:Endpoint,mode:Mode):number|null {
 if(!from.query||!to.query)return null;
 const record=records.find(r=>r.verificationStatus==='verified'&&Number.isSafeInteger(r.durationMinutes)&&r.durationMinutes!==null&&r.durationMinutes>=0&&isValidDate(r.checkedAt)&&endpointMatches(from,r.fromSpotId,r.fromPlaceName)&&endpointMatches(to,r.toSpotId,r.toPlaceName)&&r.travelMode===mode);
 return record?.durationMinutes??null;
}
export function applyMasterToDays(days:Day[],records:TravelTime[]):Day[]{
 return days.map(day=>({...day,legs:day.legs.map(leg=>{
  if(leg.source==='manual')return leg;
  const minutes=lookupMaster(records,leg.from,leg.to,leg.mode);
  return {...leg,minutes,source:minutes===null?'unknown':'master'};
 })}));
}
