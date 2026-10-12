/* Optional browser regression suite. Requires Playwright and a local Chromium binary.
 * PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE can point to preinstalled test runtimes. */
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, 'index.mjs')).href : 'playwright');
const base = 'http://127.0.0.1:3102';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3102', '--hostname', '127.0.0.1'], { env: { ...process.env, VIBECHECK_TOKEN_SECRET: 'local-recipient-regression', NEXT_PUBLIC_SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' }, stdio: 'ignore' });
let browser;
(async () => {
  for (let retry = 0; retry < 40; retry++) { try { if ((await fetch(base + '/api/health')).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 250)); }
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}), args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-zygote'] });
  const api = await browser.newContext({ baseURL: base });
  const photos = Array.from({ length: 8 }, (_, i) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="hsl(${i * 25} 65% 85%)"/><text x="40" y="160">Memory ${i + 1}</text></svg>`));
  async function fixture(long = false) {
    const res = await api.request.post('/api/cards', { data: { recipient_name: long ? 'Aarohi'.repeat(13) : 'Aarohi', creator_name: long ? 'Kabir'.repeat(16) : 'Kabir', template_type: 'netflix_chill', theme_selected: 'midnight_romance', tier_selected: 'one_moment', card_data: { message_title: 'The company is the point.', main_body: 'Here is a small plan I would really like: a good movie, a little time, and you.\nAn ordinary night would be better with you in it. 🍿', yes_btn_text: 'Let’s make a plan 🍿', no_btn_text: 'Another time?', cover_image_urls: photos } } });
    assert.equal(res.status(), 200, await res.text()); return await res.json();
  }
  const card = await fixture(), longCard = await fixture(true), errors = [];
  async function bounds(page, label) {
    const result = await page.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll('.vc-fit-stage__content h1,.vc-fit-stage__content h2,.vc-fit-stage__content button,.vc-fit-stage__content strong,.vc-chat-room__composer input,.vc-chat-room__composer button')) {
        if (el.closest('[aria-hidden="true"]') || el.offsetParent === null) continue;
        const r = el.getBoundingClientRect();
        if (r.top < -.5 || r.left < -.5 || r.right > innerWidth + .5 || r.bottom > innerHeight + .5) bad.push({ text: el.textContent?.slice(0, 50), r: { x: r.x, y: r.y, width: r.width, height: r.height } });
      }
      return { bad, scrollX: document.documentElement.scrollWidth > innerWidth, scrollY: document.documentElement.scrollHeight > innerHeight + 1 };
    });
    assert.deepEqual(result.bad, [], `${label} clipped: ${JSON.stringify(result.bad)}`);
    assert.equal(result.scrollX, false, label + ' horizontal scroll'); assert.equal(result.scrollY, false, label + ' vertical scroll');
  }
  async function wait(page, selector) { await page.locator(selector).waitFor({ state: 'visible' }); await page.waitForTimeout(1250); }
  for (const [width, height, long] of (process.env.RECIPIENT_LAYOUT_CASE === 'long' ? [[320, 568, true]] : [[360, 640, false], [1920, 1080, false], [640, 360, false], [320, 568, true]])) {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true }); const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/card/${(long ? longCard : card).id}`); await page.waitForTimeout(300); await bounds(page, 'opening');
    await page.locator('.vc-romance-envelope-button').click(); await wait(page, '.vc-koikoi-stage--gate'); await bounds(page, 'intro'); assert.equal(await page.locator('.vc-koikoi-lineup').count(), 0);
    await page.getByRole('button', { name: 'Open your note' }).click(); await wait(page, '.vc-koikoi-stage--letter'); await page.locator('.vc-koikoi-envelope').click(); await page.locator('.vc-koikoi-letter').waitFor(); await page.waitForTimeout(1300); await bounds(page, 'letter');
    await page.getByRole('button', { name: 'A few little moments' }).click(); await wait(page, '.vc-koikoi-stage--cards'); await bounds(page, 'photos'); assert.equal(await page.locator('.vc-photo-clip-light__frames button').count(), 8);
    await page.getByRole('button', { name: 'One more thing for you' }).click(); await wait(page, '.vc-koikoi-stage--scratch'); await bounds(page, 'scratch'); assert.equal((await page.locator('.vc-scratch-note').innerText()).includes('%'), false);
    await page.getByRole('button', { name: 'Reveal without scratching' }).click(); await page.getByRole('button', { name: 'One little question' }).click(); await wait(page, '.vc-koikoi-stage--question'); await bounds(page, 'question'); assert.equal(await page.locator('.vc-koikoi-prompt-stack').count(), 0);
    if (!long) {
      const positions = [];
      for (let i = 0; i < 10; i++) { await page.locator('.vc-romance-no').dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: i + 1, bubbles: true }); await page.waitForTimeout(380); positions.push((await page.locator('.vc-romance-no').boundingBox()).x); await bounds(page, 'moving No'); }
      assert.ok(Math.max(...positions) - Math.min(...positions) > 35, 'No did not move far enough');
      const before = await page.locator('.vc-romance-no').boundingBox(); await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2); await page.waitForTimeout(400); const after = await page.locator('.vc-romance-no').boundingBox(); assert.ok(Math.abs(after.x - before.x) > 4, 'hover did not move No');
    }
    await page.locator('.vc-romance-yes').click(); await wait(page, '.vc-koikoi-stage--finale'); await bounds(page, 'names'); await page.waitForTimeout(3000); assert.equal(await page.locator('.vc-pair-names').count(), 1, 'names should wait for the reader');
    await page.getByRole('button', { name: 'Keep this little moment' }).click(); await wait(page, '.vc-final-reveal'); await bounds(page, 'keepsake');
    await page.getByRole('button', { name: 'Send a reply' }).click(); await wait(page, '.vc-chat-room'); await bounds(page, 'chat');
    if (!long) { await page.locator('.vc-chat-room__composer input').fill(`A heartfelt reply ${width}`); await page.locator('.vc-chat-room__composer button').click(); await page.getByText(`A heartfelt reply ${width}`, { exact: true }).waitFor(); assert.equal(await page.locator('.vc-chat-room__sent').count(), 0); await page.setViewportSize({ width: 360, height: 400 }); await page.waitForTimeout(250); await bounds(page, 'keyboard-sized chat'); }
    console.log(`PASS ${width}x${height}${long ? ' long names' : ''}: all reveal scenes, 8 photos, scratch, No, names and chat; no clipping, scroll or toast`); await ctx.close();
  }
  assert.deepEqual(errors, [], 'runtime errors'); await api.close(); console.log('PASS all recipient interactions; 0 runtime errors');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); server.kill(); });
