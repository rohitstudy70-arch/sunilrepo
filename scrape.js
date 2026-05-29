const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to installations page...');
  await page.goto('https://sunil-app-xi.vercel.app/installations', { waitUntil: 'networkidle2' });

  console.log('Current URL:', page.url());
  
  // Fill in login details
  console.log('Filling login form...');
  await page.waitForSelector('input[name="mobile"]');
  await page.type('input[name="mobile"]', '9761334377');
  await page.type('input[name="password"]', '12345');

  console.log('Submitting login form...');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
  ]);

  console.log('Login complete. Current URL:', page.url());
  
  // Let's check what pages are available
  // Let's create an output folder for logs
  const outputDir = path.join(__dirname, 'scraped');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Screenshot of main page after login
  await page.screenshot({ path: path.join(outputDir, 'dashboard.png') });
  let bodyHTML = await page.content();
  fs.writeFileSync(path.join(outputDir, 'dashboard.html'), bodyHTML);
  console.log('Dashboard HTML and screenshot saved.');

  // Let's check for links on the page
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim(),
      href: a.href
    }));
  });
  console.log('Found links:', links);
  fs.writeFileSync(path.join(outputDir, 'links.json'), JSON.stringify(links, null, 2));

  // Let's visit common pages mentioned in the description or found in links
  // Routes: /installations, /inventory, /purchases, /sales, /ledger, /users, /devices, /customers, /dealers, /dashboard
  const routesToVisit = [
    'https://sunil-app-xi.vercel.app/installations',
    'https://sunil-app-xi.vercel.app/inventory',
    'https://sunil-app-xi.vercel.app/purchases',
    'https://sunil-app-xi.vercel.app/sales',
    'https://sunil-app-xi.vercel.app/ledger',
    'https://sunil-app-xi.vercel.app/users',
    'https://sunil-app-xi.vercel.app/customers',
    'https://sunil-app-xi.vercel.app/dealers',
    'https://sunil-app-xi.vercel.app/devices'
  ];

  // Add any other dynamic links found
  for (const link of links) {
    if (link.href && link.href.startsWith('https://sunil-app-xi.vercel.app') && !routesToVisit.includes(link.href)) {
      routesToVisit.push(link.href);
    }
  }

  console.log('Routes to visit:', routesToVisit);

  for (const url of routesToVisit) {
    try {
      const name = url.split('/').pop() || 'index';
      console.log(`Visiting ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForTimeout?.(2000) || new Promise(resolve => setTimeout(resolve, 2000)); // wait 2s for any dynamic content
      
      const currentUrl = page.url();
      console.log(`Current URL for ${name}: ${currentUrl}`);
      
      await page.screenshot({ path: path.join(outputDir, `${name}.png`) });
      const html = await page.content();
      fs.writeFileSync(path.join(outputDir, `${name}.html`), html);
      console.log(`Saved screenshot and HTML for ${name}`);
    } catch (err) {
      console.error(`Error visiting ${url}:`, err.message);
    }
  }

  await browser.close();
  console.log('Scrape finished successfully!');
})().catch(err => {
  console.error('Fatal scrape error:', err);
  process.exit(1);
});
