import{FittedRigPlayer as a}from"./fit-player.js";import{installFitProfile as r}from"./fit-profile.js";export async function loadCandidate(i){const t=await a.load(i);return await r(t,{native:!0}),t}
