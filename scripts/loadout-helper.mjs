// Drive the public equipment grid rather than hidden compatibility form fields.
export async function equip(page,selector,value){
 let player,kind,slot;
 let m=selector.match(/^#weapon-secondary([01])$/);if(m){player=m[1];kind='weapon';slot=1;}
 else if((m=selector.match(/^#weapon([01])$/))){player=m[1];kind='weapon';slot=0;}
 else if((m=selector.match(/^#item([01])-([0-3])$/))){player=m[1];kind='item';slot=Number(m[2]);}
 else throw new Error('Unknown equipment selector: '+selector);
 await page.locator(`#edit-loadout${player}`).click();await page.locator(`[data-loadout-tab=${kind}]`).click();await page.locator(`[data-loadout-slot="${slot}"]`).click();await page.locator(`[data-pick-kind="${kind}"][data-pick-id="${value}"]`).click();await page.locator('#loadout-save').click();
}

// Existing combat regression scenarios explicitly opt into the legacy roster.
// Original-default behavior is covered separately by the global graphics suite.
export async function legacyRoster(page,{weapons=true}={}){
 if(!await page.locator('#include-anime').count())return;
 await page.locator('#include-anime').check();await page.selectOption('#roster-era','all');
 for(const [i,id] of ['naruto','sasuke'].entries()){await page.locator(`#character${i} input[value=${id}]`).check();if(weapons)await equip(page,`#weapon${i}`,'kunai');}
}
