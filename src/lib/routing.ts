import type {Endpoint,Mode} from '../types';
import {routeLinks} from './maps';
import type {RouteLink} from './maps';
import {isValidDate} from './date';
import {parseTime} from './time';
export type Departure={date:string;time:string;timeZone:'Asia/Tokyo'};
export type RouteRequest={points:Endpoint[];mode:Mode;maxWaypoints:number;departure:Departure};
export type RouteResult={links:RouteLink[];departure:Departure;supportsDepartureTime:boolean};
// The UI passes a structured request. A future API adapter can use departure;
// this Maps URLs adapter deliberately never serializes it into unsupported parameters.
export function createMapsRoute(request:RouteRequest):RouteResult {
 return {links:routeLinks(request.points,request.mode,request.maxWaypoints),departure:request.departure,supportsDepartureTime:false};
}
export function departureText(departure:Departure):string {
 if(!isValidDate(departure.date)||parseTime(departure.time)===null)return '出発日時未設定';
 return `${departure.date.replaceAll('-','/')} ${departure.time}（日本時間）`;
}
