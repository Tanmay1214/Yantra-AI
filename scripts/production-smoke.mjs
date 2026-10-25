import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('http://127.0.0.1:4173/wadokei');assert.equal(response.status(),200);
 await page.getByTestId('scene').waitFor();await page.waitForFunction(()=>window.__wadokei?.snapshot().ready===true);
 await page.waitForTimeout(1600);
 const state=await page.evaluate(()=>window.__wadokeiScene());assert.equal(state.gears.length,9);assert.equal(state.parts.length,21);
 await page.getByTestId('mode-interior').click();await page.waitForTimeout(1000);
 assert.equal(await page.evaluate(()=>window.__wadokeiScene().parts.find(p=>p.name==='dial').visible),false);
 await page.getByTestId('mode-exterior').click();await page.waitForTimeout(1400);
 await page.screenshot({path:'artifacts/production-exterior.png'});
 for(const preset of ['front','side','rear','top']){
   await page.getByTestId(`camera-${preset}`).click();await page.waitForTimeout(1300);
   await page.screenshot({path:`artifacts/view-${preset}.png`});
 }
 assert.deepEqual(errors,[]);console.log('Production smoke passed: HTTP 200, WebGL mounted, 21 named groups, 9 named toothed meshes, interior/exterior transition, no uncaught errors.');
}finally{await browser.close();}
