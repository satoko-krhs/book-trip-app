import type {Endpoint,Mode,Spot} from '../types';
export const spotEndpoint=(spot:Spot):Endpoint=>({id:spot.id,name:spot.name,query:`${spot.name} ${spot.address}`});
export const placeEndpoint=(name:string):Endpoint=>({name:name.trim(),query:name.trim()});
export function placeUrl(spot:Spot){const p=new URLSearchParams({api:'1',query:`${spot.name} ${spot.address}`});if(spot.placeId)p.set('query_place_id',spot.placeId);return `https://www.google.com/maps/search/?${p}`;}
export function directionsUrl(points:Endpoint[],mode:Mode){const p=new URLSearchParams({api:'1',origin:points[0].query,destination:points.at(-1)!.query,travelmode:mode});if(points.length>2)p.set('waypoints',points.slice(1,-1).map(p=>p.query).join('|'));return `https://www.google.com/maps/dir/?${p}`;}
// At most three waypoints per URL for mobile compatibility. The boundary point is repeated.
export function routeUrls(points:Endpoint[],mode:Mode):string[]{if(points.some(p=>!p.query)||points.length<2)return [];const result:string[]=[];for(let i=0;i<points.length-1;i+=4)result.push(directionsUrl(points.slice(i,i+5),mode));return result;}
