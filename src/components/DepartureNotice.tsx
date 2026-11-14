import {useEffect,useRef,useState} from 'react';
import type {Departure} from '../lib/routing';
import {departureText} from '../lib/routing';
import Icon from './Icon';
export default function DepartureNotice({departure,dayNumber}:{departure:Departure;dayNumber:number}){
 const [message,setMessage]=useState(''),[manual,setManual]=useState<{kind:'日付'|'時刻';value:string}|null>(null);
 const input=useRef<HTMLInputElement>(null);
 const date=departure.date.replaceAll('-','/'),time=departure.time;
 useEffect(()=>{if(manual){input.current?.focus();input.current?.select();}},[manual]);
 async function copy(kind:'日付'|'時刻'){
  const value=kind==='日付'?date:time;
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(value);setManual(null);setMessage(`${kind}をコピーしました。Google Mapsの日時欄に貼り付けられない場合は手動で設定してください。`);}
  catch{setManual({kind,value});setMessage(`コピーが許可されていません。下の${kind}を選択してCtrl+C（Macは⌘C）でコピーするか、Google Mapsで手動設定してください。`);}
 }
 return <div className="departure-notice"><p><Icon name="clock"/> Day {dayNumber}の出発日時：<strong>{departureText(departure)}</strong></p><div className="departure-copy-actions"><button type="button" className="button small" onClick={()=>copy('日付')}><Icon name="copy"/>日付をコピー</button><button type="button" className="button small" onClick={()=>copy('時刻')}><Icon name="copy"/>時刻をコピー</button></div><small>出発日時はGoogle Mapsへ自動設定されません。経路を開いた後、「出発時刻」を選び、日付 {date}・時刻 {time} を指定してください。交通手段によって日時設定を利用できない場合があります。</small><small>日時欄が貼り付けに対応していない場合は、カレンダー・時刻選択で手動設定してください。コピーした値は参照用です。</small>{message&&<p className="copy-message" role="status">{message}</p>}{manual&&<input ref={input} readOnly value={manual.value} aria-label={`Day ${dayNumber}のコピー用${manual.kind}`} onFocus={e=>e.currentTarget.select()}/>}</div>;
}
