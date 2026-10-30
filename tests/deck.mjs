import fs from 'node:fs';import assert from 'node:assert/strict';
const {PICTURES,shuffledDeck}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('../model.js',import.meta.url))).toString('base64'));
let seed=42;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
let previous=-1;for(let cycle=0;cycle<100;cycle++){const deck=shuffledDeck(PICTURES.length,previous,random);assert.equal(deck.length,36);assert.equal(new Set(deck).size,36);assert.notEqual(deck[0],previous);assert(deck.some(i=>PICTURES[i].topic==='letters'));assert(deck.some(i=>PICTURES[i].topic==='numbers'));previous=deck.at(-1);}
console.log('PASS: legacy finite-deck shuffle helper remains correct across 100 cycles. Current runtime uses puzzle-generator.js.');
