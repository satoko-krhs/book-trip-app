import {useEffect,useState} from 'react';
import type {Book,Day,Settings} from '../types';
import {dayRoutePoints,scheduleDay} from '../lib/itinerary';
import {formatTime,nullableMinutes} from '../lib/time';
import {routeLabel,waypointLimit} from '../lib/maps';
import {createMapsRoute} from '../lib/routing';
import {addCalendarDays} from '../lib/date';
import DepartureNotice from './DepartureNotice';
import {durationLabels,modeLabels} from './TripSettings';
import SpotCard from './SpotCard';
import TimeEditor from './TimeEditor';
import TripSummary from './TripSummary';
import Icon from './Icon';
export default function Itinerary({book,settings,days,setDays,onBack}:{book:Book;settings:Settings;days:Day[];setDays:(days:Day[])=>void;onBack:()=>void}){
 const [compact,setCompact]=useState(()=>window.matchMedia('(max-width:700px)').matches);
 useEffect(()=>{const media=window.matchMedia('(max-width:700px)');const update=()=>setCompact(media.matches);media.addEventListener('change',update);return ()=>media.removeEventListener('change',update);},[]);
 const maxWaypoints=waypointLimit(navigator.userAgent,compact);
 const setStay=(di:number,si:number,n:number)=>setDays(days.map((day,i)=>i===di?{...day,stays:day.stays.map((s,j)=>j===si?n:s)}:day));
 const setTravel=(di:number,li:number,raw:string)=>setDays(days.map((day,i)=>i===di?{...day,legs:day.legs.map((l,j)=>j===li?{...l,minutes:nullableMinutes(raw),source:'manual'}:l)}:day));
 return <><button className="text-link back-button" onClick={onBack}><Icon name="back"/>旅行条件に戻る</button><div className="itinerary-heading"><div><div className="eyebrow">A JOURNEY THROUGH THE STORY</div><h1>『{book.title}』を巡る旅</h1><p>{book.area} <span>／</span> {durationLabels[settings.duration]} <span>／</span> {days.reduce((a,d)=>a+d.spots.length,0)}スポット <span>／</span> {modeLabels[settings.mode]}</p></div><span className="badge">固定順のプラン</span></div><div className="itinerary-layout"><div>{days.map((day,di)=>{const schedule=scheduleDay(day),route=createMapsRoute({points:dayRoutePoints(day),mode:settings.mode,maxWaypoints,departure:{date:addCalendarDays(settings.travelDate,di),time:formatTime(day.startMinutes),timeZone:'Asia/Tokyo'}}),links=route.links;return <section className="day-section" key={di}><div className="day-heading"><h2>Day {di+1}</h2><span>{day.spots.length}つのスポットを巡る</span></div><div className="endpoint"><span className="endpoint-tag">START</span><strong>{day.origin.name||'出発地未入力'}</strong><span>{formatTime(day.startMinutes)}</span></div>{day.spots.map((spot,si)=><div key={spot.id}><TimeEditor leg={day.legs[si]} onChange={v=>setTravel(di,si,v)}/><SpotCard spot={spot} number={di*2+si+1} stay={day.stays[si]} arrival={schedule.visits[si].arrival} departure={schedule.visits[si].departure} onStay={n=>setStay(di,si,n)}/></div>)}{!day.endsAtLastSpot&&<TimeEditor leg={day.legs.at(-1)!} onChange={v=>setTravel(di,day.legs.length-1,v)}/>}<div className="endpoint"><span className="endpoint-tag">GOAL</span><strong>{day.destination.name||'最終目的地未入力'}</strong><span>{formatTime(schedule.end)}</span></div><div className="route-panel"><div><Icon name="route"/><strong>Day {di+1} の経路を確認</strong></div><DepartureNotice departure={route.departure} dayNumber={di+1}/>{links.length?links.map((link,i)=><a className="button primary" key={link.url} href={link.url} target="_blank" rel="noreferrer"><Icon name="external"/><span>{routeLabel(link,i,links.length)}</span></a>):<p>出発地と最終目的地を旅行条件で入力してください。</p>}{links.length>1&&<small>経由地点数・URL長の制限に合わせて分割しています。前半の到着地を後半の出発地にも含め、訪問順序を維持しています。</small>}<small>訪問順序は固定です。滞在時間・手入力の移動時間はGoogle Mapsに送信しません。</small></div></section>;})}</div><TripSummary days={days}/></div></>;
}
