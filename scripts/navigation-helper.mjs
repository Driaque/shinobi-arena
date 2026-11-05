// Follow the visible navigation and setup steps in existing gameplay scenarios.
export async function openNavigation(page,selector){
 const menu=['#mode','#arena-hub','#account-profile'];
 const settings=['#difficulty','#control-settings','#graphics-settings','#audio-settings','#experience-settings','#training-settings','#training-reset'];
 const group=menu.includes(selector)?'#game-menu':settings.includes(selector)?'#game-settings':null;
 if(group&&!(await page.locator(group).getAttribute('open')!==null))await page.locator(group+' > summary').click();
 return group;
}
export async function clickGame(page,selector){
 await openNavigation(page,selector);
 if(selector==='#play'&&await page.locator('#loadout-panel').isVisible()&&(await page.locator(selector).innerText())!=='View tournament bracket')await page.locator(selector).click();
 await page.locator(selector).click();
}
export async function selectGame(page,selector,value){
 const group=await openNavigation(page,selector);await page.selectOption(selector,value);
 if(group&&await page.locator(group).getAttribute('open')!==null)await page.locator(group+' > summary').click();
}
