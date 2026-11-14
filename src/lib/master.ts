import initial from '../data/travel-times.json';
import type {Endpoint,Mode,TravelTime} from '../types';
export const STORAGE_KEY='booktrip-travel-times-v1';
const modes=['walking','driving','transit'];
export function validRecord(v:unknown):v is TravelTime {
 if(!v||typeof v!=='object')return false;const r=v as TravelTime;
 return typeof r.id==='string'&&typeof r.fromSpotId==='string'&&typeof r.toSpotId==='string'&&modes.includes(r.travelMode)&&(r.durationMinutes===null||(Number.isSafeInteger(r.durationMinutes)&&r.durationMinutes>=0))&&['verified','unverified'].includes(r.verificationStatus)&&(r.checkedAt===null||typeof r.checkedAt==='string')&&(r.sourceUrl===null||typeof r.sourceUrl==='string')&&(r.fromPlaceName===undefined||typeof r.fromPlaceName==='string')&&(r.toPlaceName===undefined||typeof r.toPlaceName==='string');
}
export function loadMaster():TravelTime[]{try{const saved=localStorage.getItem(STORAGE_KEY);if(saved){const parsed=JSON.parse(saved);if(Array.isArray(parsed)&&parsed.every(validRecord))return parsed;}}catch{/* use bundled data if storage unavailable/corrupted */}return initial as TravelTime[];}
export function endpointMatches(endpoint:Endpoint,id:string,name?:string){return endpoint.id?endpoint.id===id:!id&&endpoint.name.trim()===name?.trim();}
export function lookupMaster(records:TravelTime[],from:Endpoint,to:Endpoint,mode:Mode):number|null {
 if(!from.query||!to.query)return null;
 const record=records.find(r=>r.verificationStatus==='verified'&&r.durationMinutes!==null&&r.checkedAt&&endpointMatches(from,r.fromSpotId,r.fromPlaceName)&&endpointMatches(to,r.toSpotId,r.toPlaceName)&&r.travelMode===mode);
 return record?.durationMinutes??null;
}
