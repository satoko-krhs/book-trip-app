import type {Endpoint,Mode,Spot} from '../types';
export const spotEndpoint=(spot:Spot):Endpoint=>({id:spot.id,name:spot.name,query:`${spot.name} ${spot.address}`});
export const placeEndpoint=(name:string):Endpoint=>({name:name.trim(),query:name.trim()});
export function placeUrl(spot:Spot){const p=new URLSearchParams({api:'1',query:`${spot.name} ${spot.address}`});if(spot.placeId)p.set('query_place_id',spot.placeId);return `https://www.google.com/maps/search/?${p}`;}
export function directionsUrl(points:Endpoint[],mode:Mode){const p=new URLSearchParams({api:'1',origin:points[0].query,destination:points.at(-1)!.query,travelmode:mode});if(points.length>2)p.set('waypoints',points.slice(1,-1).map(p=>p.query).join('|'));return `https://www.google.com/maps/dir/?${p}`;}
export type RouteLink={url:string;from:Endpoint;to:Endpoint};
export function waypointLimit(userAgent:string,compact:boolean):number {
 return compact||/Android|iPhone|iPad|iPod|Mobi/i.test(userAgent)?3:9;
}
// Google Maps URLs support up to 3 waypoints on mobile browsers and 9 elsewhere.
// Balance split sections and repeat the boundary point to preserve every ordered edge.
export function routeLinks(points:Endpoint[],mode:Mode,maxWaypoints=3):RouteLink[]{
 if(points.length<2||points.some(p=>!p.query.trim()))return [];
 if(!Number.isInteger(maxWaypoints)||maxWaypoints<0||maxWaypoints>9)throw new RangeError('Invalid waypoint limit');
 const links:RouteLink[]=[];
 let start=0;
 while(start<points.length-1){
  const edges=points.length-1-start;
  const sections=Math.ceil(edges/(maxWaypoints+1));
  let end=start+Math.ceil(edges/sections);
  // Maps URLs also have a 2,048-character limit after URL encoding.
  while(end>start+1&&directionsUrl(points.slice(start,end+1),mode).length>2048)end--;
  const section=points.slice(start,end+1);
  links.push({url:directionsUrl(section,mode),from:section[0],to:section.at(-1)!});
  start=end;
 }
 return links;
}
export function routeUrls(points:Endpoint[],mode:Mode,maxWaypoints=3):string[]{return routeLinks(points,mode,maxWaypoints).map(link=>link.url);}
export function routeLabel(link:RouteLink,index:number,count:number):string {
 if(count===1)return 'Google Mapsで経路を見る';
 const section=count===2?(index===0?'前半':'後半'):`区間${index+1}`;
 return `${section}：${link.from.name} → ${link.to.name}`;
}
