import templates from '../data/itinerary-templates.json';
import allSpots from '../data/spots.json';
import type {Book,Day,Settings,Spot,TravelTime} from '../types';
import {placeEndpoint,spotEndpoint} from './maps';
import {parseTime} from './time';
import {lookupMaster} from './master';
export function createDays(book:Book,settings:Settings,master:TravelTime[]):Day[]{
 return templates[settings.duration].map((indices,index)=>{
 const spots=indices.map(i=>allSpots.find(s=>s.id===book.spotIds[i])! as Spot);
 const origin=placeEndpoint(index===0?settings.origin:settings.day2Start);
 const destination=placeEndpoint(settings.duration==='two'&&index===0?settings.day1End:settings.destination);
 const points=[origin,...spots.map(spotEndpoint),destination];
 return {index,origin,destination,startMinutes:parseTime(index===0?settings.startTime:settings.day2Time)!,spots,stays:spots.map(s=>s.defaultStayMinutes),legs:points.slice(0,-1).map((from,i)=>{const to=points[i+1],minutes=lookupMaster(master,from,to,settings.mode);return {id:`${index}-${i}`,from,to,mode:settings.mode,minutes,source:minutes===null?'unknown':'master'};})};
 });
}
export function scheduleDay(day:Day){
 let clock:number|null=day.startMinutes;
 const visits=day.spots.map((_,i)=>{clock=clock===null||day.legs[i].minutes===null?null:clock+day.legs[i].minutes!;const arrival=clock;clock=clock===null?null:clock+day.stays[i];return {arrival,departure:clock};});
 const last=day.legs.at(-1)!;const end=clock===null||last.minutes===null?null:clock+last.minutes;
 const stay=day.stays.reduce((a,b)=>a+b,0);const travel=day.legs.reduce((a,b)=>a+(b.minutes??0),0);const unknown=day.legs.filter(l=>l.minutes===null).length;
 return {visits,end,stay,travel,unknown,total:unknown?null:stay+travel};
}
