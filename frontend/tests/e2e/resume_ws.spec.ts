import { test, expect } from '@playwright/test';
import util from 'util';
import child_process from 'child_process';

const exec = util.promisify(child_process.exec);

test('ws publish updates page', async ({ page }) => {
  // open home page to ensure same-origin for WS
  await page.goto('/');

  // inject a small DOM node that the page-level WS will update for assertions
  await page.evaluate(() => {
    const existing = document.getElementById('ws-event');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'ws-event';
    div.textContent = '';
    document.body.appendChild(div);
  });

  // open a WebSocket in the page context that writes received messages into #ws-event
  const userId = 1;
  await page.evaluate((userId) => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${proto}://${window.location.host}/api/v1/ws/${userId}`;
    // eslint-disable-next-line no-console
    console.debug('E2E: opening ws', wsUrl);
    const ws = new WebSocket(wsUrl);
    // attach for debugging
    (window as any).__e2e_ws = ws;
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const el = document.getElementById('ws-event');
        if (el) el.textContent = JSON.stringify(data);
      } catch (e) {
        const el = document.getElementById('ws-event');
        if (el) el.textContent = ev.data;
      }
    };
    ws.onerror = (err) => {
      // eslint-disable-next-line no-console
      console.error('E2E WS error', err);
    };
  }, userId);

  // Trigger the backend publisher using the test HTTP endpoint we added at /api/v1/test/publish
  const publishPayload = { user: String(userId), event: 'RESUME_PARSED_SUCCESS', data: { name: 'E2E Test' } };
  const resp = await page.request.post('/api/v1/test/publish', { data: publishPayload });
  if (!resp.ok()) {
    throw new Error('Failed to call test publish endpoint: ' + (await resp.text()));
  }

  // wait for the page to receive and render the message
  await page.waitForFunction(() => {
    const el = document.getElementById('ws-event');
    return !!el && el.textContent && el.textContent.indexOf('RESUME_PARSED_SUCCESS') !== -1;
  }, { timeout: 15000 });

  const text = await page.textContent('#ws-event');
  expect(text).toContain('RESUME_PARSED_SUCCESS');
  expect(text).toContain('E2E Test');
});
