import type {ReactNode} from 'react';
import type {Book,Settings,Duration,Mode} from '../types';
import {day1FinalSpot} from '../lib/itinerary';
import {isValidDate} from '../lib/date';
import {parseTime} from '../lib/time';
import Icon from './Icon';
export const durationLabels:Record<Duration,string>={half:'半日',one:'1日',two:'2日'};
export const modeLabels:Record<Mode,string>={walking:'徒歩',driving:'自動車',transit:'公共交通機関'};
function Field({id,label,required=false,error,hint,children}:{id:string;label:string;required?:boolean;error?:string;hint?:string;children:ReactNode}){
 return <div className="form-field"><label htmlFor={id}>{label}{required&&<> <span className="required">必須</span></>}</label>{children}{hint&&<span className="field-help" id={`${id}-hint`}>{hint}</span>}{error&&<p className="field-error" id={`${id}-error`}>入力エラー：{error}</p>}</div>;
}
export default function TripSettings({value,onChange,book,showErrors=false}:{value:Settings;onChange:(s:Settings)=>void;book?:Book;showErrors?:boolean}){
 const update=(key:keyof Settings,v:string)=>{
  if(key==='day1End')onChange({...value,day1End:v,day2Start:!value.day2Start||value.day2Start===value.day1End?v:value.day2Start});
  else onChange({...value,[key]:v});
 };
 const errors={origin:showErrors&&!value.origin.trim()?'駅名・住所・施設名を入力してください。':undefined,destination:showErrors&&!value.destination.trim()?'帰着地を入力してください。':undefined,date:showErrors&&!isValidDate(value.travelDate)?'旅行日を選択してください。':undefined,start:showErrors&&parseTime(value.startTime)===null?'出発時刻を入力してください。':undefined,day2:showErrors&&parseTime(value.day2Time)===null?'Day 2の出発時刻を入力してください。':undefined};
 return <div className="settings"><div className="field-grid">
 <Field id="trip-origin" label="出発地" required error={errors.origin} hint="駅名・住所・施設名を入力してください。"><input id="trip-origin" name="origin" required value={value.origin} aria-invalid={!!errors.origin} aria-describedby={`trip-origin-hint${errors.origin?' trip-origin-error':''}`} onChange={e=>onChange({...value,origin:e.target.value,destination:value.destination===value.origin?e.target.value:value.destination})} placeholder="例：松山駅" autoComplete="off"/></Field>
 <Field id="trip-destination" label="帰着地" required error={errors.destination} hint="初期値は出発地と同じです。別の場所も指定できます。"><input id="trip-destination" name="destination" required value={value.destination} aria-invalid={!!errors.destination} aria-describedby={`trip-destination-hint${errors.destination?' trip-destination-error':''}`} onChange={e=>update('destination',e.target.value)} placeholder="帰りに到着する場所"/></Field></div>
 <div className="field-grid trip-date-row"><Field id="trip-date" label="旅行日" required error={errors.date} hint="2日プランのDay 2は翌日になります。"><input id="trip-date" name="travelDate" type="date" value={value.travelDate} aria-invalid={!!errors.date} aria-describedby={`trip-date-hint${errors.date?' trip-date-error':''}`} onChange={e=>update('travelDate',e.target.value)} required/></Field></div>
 <div className="field-grid three"><fieldset><legend>旅行日数</legend><div className="segments">{(Object.keys(durationLabels) as Duration[]).map(d=><button key={d} type="button" className={value.duration===d?'active':''} aria-pressed={value.duration===d} onClick={()=>update('duration',d)}>{value.duration===d&&<Icon name="check"/>}{durationLabels[d]}</button>)}</div><span className="field-help">半日：2地点 ／ 1日：4地点 ／ 2日：2地点ずつ</span></fieldset>
 <Field id="trip-start" label="出発時刻" required error={errors.start} hint="旅行先の現地時刻（日本時間）です。"><input id="trip-start" type="time" value={value.startTime} aria-invalid={!!errors.start} aria-describedby={`trip-start-hint${errors.start?' trip-start-error':''}`} onChange={e=>update('startTime',e.target.value)} required/></Field>
 <Field id="trip-mode" label="交通手段"><select id="trip-mode" value={value.mode} onChange={e=>update('mode',e.target.value)}>{Object.entries(modeLabels).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></Field></div>
 {value.duration==='two'&&<div className="overnight"><p><Icon name="pin"/> 2日間の訪問先と宿泊先</p><div className="field-grid"><Field id="trip-final-spot" label="Day 1の最終観光地点（自動）" hint="宿泊先がなければ、この地点でDay 1を終了します。"><input id="trip-final-spot" readOnly value={book?day1FinalSpot(book).name:''} placeholder="作品を選ぶと自動設定されます" aria-describedby="trip-final-spot-hint"/></Field><Field id="trip-hotel" label="宿泊先（任意）"><input id="trip-hotel" value={value.day1End} onChange={e=>update('day1End',e.target.value)} placeholder="宿泊施設の名前・住所"/></Field><Field id="trip-day2-origin" label="Day 2の出発地（宿泊先）"><input id="trip-day2-origin" value={value.day2Start} onChange={e=>update('day2Start',e.target.value)} placeholder="宿泊先、または別の出発地"/></Field><Field id="trip-day2-time" label="Day 2の出発時刻" required error={errors.day2}><input id="trip-day2-time" type="time" value={value.day2Time} aria-invalid={!!errors.day2} aria-describedby={errors.day2?'trip-day2-time-error':undefined} onChange={e=>update('day2Time',e.target.value)} required/></Field></div><small>宿泊先を入力するとDay 2の出発地にも初期設定します。宿泊先が未入力の場合は、Day 2の出発地を指定してください。</small></div>}</div>;
}
