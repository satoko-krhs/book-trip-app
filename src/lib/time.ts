export function parseTime(value:string):number|null {
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
 const [h,m]=value.split(':').map(Number); return h*60+m;
}
export function formatTime(value:number|null):string {
 if(value===null) return '--:--';
 const days=Math.floor(value/1440), rest=value%1440;
 return (days===1?'翌日 ':days>1?`${days}日後 `:'')+`${Math.floor(rest/60)}`.padStart(2,'0')+':'+`${rest%60}`.padStart(2,'0');
}
export function formatMinutes(value:number):string {return value>=60?`${Math.floor(value/60)}時間${value%60?`${value%60}分`:''}`:`${value}分`;}
export function nullableMinutes(raw:string):number|null {if(raw.trim()==='') return null;const n=Number(raw);return Number.isSafeInteger(n)&&n>=0?n:null;}
