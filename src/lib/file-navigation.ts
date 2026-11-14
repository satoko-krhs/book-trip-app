// Both web and single-file distributions navigate inside the same document.
export const NAVIGATION_EVENT='booktrip:navigation';
export function currentRoute(location:Pick<Location,'protocol'|'pathname'|'hash'>,standalone=false):string {
 return location.protocol==='file:'||standalone ? (location.hash.slice(1)||'/') : location.pathname;
}
export function isStandalone(){return window.location.protocol==='file:'||!!document.querySelector('meta[name="booktrip-standalone"]');}
export function currentLocationRoute(){return currentRoute(window.location,isStandalone());}
export function subscribeNavigation(listener:()=>void){
 for(const name of [NAVIGATION_EVENT,'popstate','hashchange'])window.addEventListener(name,listener);
 return ()=>{for(const name of [NAVIGATION_EVENT,'popstate','hashchange'])window.removeEventListener(name,listener);};
}
export function installFileNavigation(){
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const anchor=event.target instanceof Element?event.target.closest('a'):null;
  const route=anchor?.getAttribute('href');
  if(!anchor||anchor.target==='_blank'||!['/','/admin/travel-times'].includes(route??''))return;
  event.preventDefault();
  if(isStandalone())window.location.hash=route!;
  else {window.history.pushState(null,'',route);window.dispatchEvent(new Event(NAVIGATION_EVENT));}
  window.scrollTo({top:0});
 });
}
