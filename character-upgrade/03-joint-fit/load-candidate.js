import {FittedRigPlayer} from './fit-player.js';
import {installFitProfile} from './fit-profile.js';
export async function loadCandidate(manifestURL){const rig=await FittedRigPlayer.load(manifestURL);await installFitProfile(rig,{native:true});return rig;}
