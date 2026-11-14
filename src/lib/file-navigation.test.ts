import test from 'node:test';
import assert from 'node:assert/strict';
import {currentRoute} from './file-navigation';
test('file distribution routes use hash; hosted routes keep pathname',()=>{
 assert.equal(currentRoute({protocol:'file:',pathname:'/C:/BookTrip/BookTrip.html',hash:''}),'/');
 assert.equal(currentRoute({protocol:'file:',pathname:'/C:/BookTrip/BookTrip.html',hash:'#/admin/travel-times'}),'/admin/travel-times');
 assert.equal(currentRoute({protocol:'https:',pathname:'/admin/travel-times',hash:'#ignored'}),'/admin/travel-times');
 assert.equal(currentRoute({protocol:'http:',pathname:'/BookTrip.html',hash:'#/admin/travel-times'},true),'/admin/travel-times');
});
