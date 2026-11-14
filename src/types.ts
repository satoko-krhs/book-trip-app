export type Mode = 'walking' | 'driving' | 'transit';
export type Duration = 'half' | 'one' | 'two';
export type Verification = 'verified' | 'unverified';
export type Book = {id:string; title:string; author:string; area:string; description:string; imageUrl:string|null; spotIds:string[]};
export type Spot = {id:string; name:string; address:string; placeId?:string; description:string; relationNote:string; sourceUrl:string|null; verificationStatus:Verification; defaultStayMinutes:number};
// Each endpoint is either a known spot ID or a free-text place; never assume reverse symmetry.
export type TravelTime = {id:string; bookId?:string; fromSpotId:string; toSpotId:string; fromPlaceName?:string; toPlaceName?:string; travelMode:Mode; durationMinutes:number|null; checkedAt:string|null; sourceUrl:string|null; verificationStatus:Verification};
export type Settings = {bookId:string; origin:string; destination:string; duration:Duration; startTime:string; day1End:string; day2Start:string; day2Time:string; mode:Mode};
export type Endpoint = {id?:string; name:string; query:string};
export type Leg = {id:string; from:Endpoint; to:Endpoint; mode:Mode; minutes:number|null; source:'master'|'manual'|'unknown'};
export type Day = {index:number; origin:Endpoint; destination:Endpoint; startMinutes:number; spots:Spot[]; stays:number[]; legs:Leg[]};
