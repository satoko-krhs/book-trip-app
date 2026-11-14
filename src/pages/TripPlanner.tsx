import {useEffect,useState} from 'react';
import bookData from '../data/books.json';
import type {Book,Day,Mode,Settings} from '../types';
import BookSelector from '../components/BookSelector';
import TripSettings from '../components/TripSettings';
import Itinerary from '../components/Itinerary';
import Icon from '../components/Icon';
import {createDays} from '../lib/itinerary';
import {parseTime} from '../lib/time';
import {applyMasterToDays,loadMasterSnapshot,MASTER_UPDATED_EVENT,STORAGE_KEY} from '../lib/master';
import {isValidDate,localDateISO} from '../lib/date';
const books=bookData as Book[];
export default function TripPlanner({active=true,onBookChange,onModeChange}:{active?:boolean;onBookChange?:(id:string)=>void;onModeChange?:(mode:Mode)=>void}){
 const [settings,setSettings]=useState<Settings>({bookId:'',origin:'',destination:'',duration:'one',startTime:'08:00',travelDate:localDateISO(),day1End:'',day2Start:'',day2Time:'09:00',mode:'transit'});
 const [masterState,setMasterState]=useState(loadMasterSnapshot);
 useEffect(()=>{onBookChange?.(settings.bookId);},[settings.bookId,onBookChange]);
 useEffect(()=>{onModeChange?.(settings.mode);},[settings.mode,onModeChange]);
 const [days,setDays]=useState<Day[]|null>(null),[errors,setErrors]=useState<string[]>([]);
 useEffect(()=>{
  if(!active)return;
  const refresh=()=>{const snapshot=loadMasterSnapshot();setMasterState(snapshot);setDays(current=>current?applyMasterToDays(current,snapshot.records):current);};
  const onStorage=(event:StorageEvent)=>{if(event.key===STORAGE_KEY||event.key===null)refresh();};
  refresh();window.addEventListener(MASTER_UPDATED_EVENT,refresh);window.addEventListener('storage',onStorage);
  return ()=>{window.removeEventListener(MASTER_UPDATED_EVENT,refresh);window.removeEventListener('storage',onStorage);};
 },[active]);
 function generate(e:React.FormEvent){e.preventDefault();const issues:string[]=[];if(!settings.bookId)issues.push('作品を選択してください。');if(!settings.origin.trim())issues.push('出発地を入力してください。');if(!settings.destination.trim())issues.push('帰着地を入力してください。');if(!isValidDate(settings.travelDate))issues.push('有効な旅行日を入力してください。');if(parseTime(settings.startTime)===null)issues.push('有効な出発時刻を入力してください。');if(settings.duration==='two'&&parseTime(settings.day2Time)===null)issues.push('Day 2の有効な出発時刻を入力してください。');setErrors(issues);if(issues.length)return;const snapshot=loadMasterSnapshot();setMasterState(snapshot);setDays(createDays(books.find(b=>b.id===settings.bookId)!,settings,snapshot.records));window.scrollTo({top:0,behavior:'instant'});}
 if(days)return <Itinerary book={books.find(b=>b.id===settings.bookId)!} settings={settings} masterMessage={masterState.message} days={days} setDays={setDays} onBack={()=>{setDays(null);window.scrollTo({top:0});}}/>;
 return <><section className="hero"><span className="eyebrow">LITERATURE MEETS JOURNEY</span><div className="hero-line"><h1>本の世界を、<br className="mobile-break"/>旅しよう。</h1><div className="hero-decoration" aria-hidden="true"><Icon name="book"/><span>········</span><Icon name="pin"/></div></div><p>お気に入りの物語から、あなただけの旅をつくる。</p><span className="hero-footnote">ページをめくる、その先の景色へ。</span></section><form noValidate onSubmit={generate}><section className="section"><div className="section-heading"><span className="step">01</span><div><h2>旅のはじまりは、一冊の本から。</h2><p>気になる作品を選んでください。</p></div><span className="section-side">SELECT YOUR BOOK</span></div><BookSelector books={books} selected={settings.bookId} onSelect={id=>setSettings({...settings,bookId:id})}/><p className="data-note">掲載地点は研修用の旅行候補地です。作品に直接登場する場所と断定するものではありません。</p></section><section className="section panel settings-panel"><div className="section-heading"><span className="step">02</span><div><h2>旅のかたちを、決めましょう。</h2><p>出発する場所と、旅に使える時間を教えてください。</p></div><Icon name="route"/></div><TripSettings value={settings} onChange={setSettings} book={books.find(b=>b.id===settings.bookId)}/></section>{errors.length>0&&<div className="error-box" role="alert">{errors.map(s=><p key={s}>{s}</p>)}</div>}<div className="generate-row"><p><Icon name="clock"/> あなたのペースで、物語の舞台へ。<small>滞在時間・移動時間はあとから編集できます。</small></p><button className="button primary generate" type="submit"><Icon name="route"/>旅程を作成する<Icon name="arrow"/></button></div></form></>;
}
