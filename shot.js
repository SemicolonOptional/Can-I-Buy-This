const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1000 });
  await page.setCookie({ name: (await import('fs')) && 'connect.sid', value: '', url: 'http://localhost:3000' });
  // just navigate with real cookie jar via fetch not easy in puppeteer without login flow; do UI login instead
  await page.goto('http://localhost:3000/login.html');
  await page.type('#username', 'shottest');
  await page.type('#password', 'testpass123');
  await Promise.all([
    page.click('#submit-btn'),
    page.waitForNavigation(),
  ]);
  await page.waitForSelector('#item-price');
  await page.type('#item-price', '2000');
  await page.type('#item-name', 'Laptop');
  await page.screenshot({ path: '/tmp/light.png' });

  // switch to dark
  await page.click('#settings-btn');
  await page.click('[data-theme-choice="dark"]');
  await page.screenshot({ path: '/tmp/dark.png' });

  await browser.close();
})();
