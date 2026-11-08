export function canControlSetup(slot,owner,paired){
 if(!paired)return slot===0;
 return owner===null||owner===undefined?slot===0:Number(owner)===slot;
}
