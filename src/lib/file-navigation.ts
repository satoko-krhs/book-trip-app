// The web app keeps its normal routes; the downloadable HTML uses hash routes.
export function currentRoute(location:Pick<Location,'protocol'|'pathname'|'hash'>,standalone=false):string {
 return location.protocol==='file:'||standalone ? (location.hash.slice(1)||'/') : location.pathname;
}
export function installFileNavigation(){
 if(window.location.protocol!=='file:'&&!document.querySelector('meta[name="booktrip-standalone"]'))return;
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const anchor=event.target instanceof Element?event.target.closest('a'):null;
  const route=anchor?.getAttribute('href');
  if(!anchor||anchor.target==='_blank'||!['/','/admin/travel-times'].includes(route??''))return;
  event.preventDefault();
  window.location.hash=route!;
 });
 window.addEventListener('hashchange',()=>window.location.reload());
}
