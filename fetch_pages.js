const fs = require('fs');
const path = require('path');

async function fetchPage(url, cookie) {
  console.log(`Fetching ${url}...`);
  const res = await fetch(url, {
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  console.log(`Status for ${url}: ${res.status}`);
  if (res.status === 200) {
    return await res.text();
  }
  return null;
}

async function run() {
  const formData = new FormData();
  formData.append('mobile', '9761334377');
  formData.append('password', '12345');

  console.log('Logging in...');
  const loginRes = await fetch('https://sunil-app-xi.vercel.app/api/login', {
    method: 'POST',
    body: formData
  });

  if (!loginRes.ok) {
    throw new Error('Login failed: ' + loginRes.status);
  }

  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('No set-cookie header in response');
  }

  // Extract the sessionToken cookie value
  const cookieMatch = setCookie.match(/sessionToken=[^;]+/);
  if (!cookieMatch) {
    throw new Error('Could not find sessionToken in set-cookie: ' + setCookie);
  }
  const sessionCookie = cookieMatch[0];
  console.log('Session Cookie:', sessionCookie);

  const outputDir = path.join(__dirname, 'scraped_html');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const pages = [
    'https://sunil-app-xi.vercel.app/',
    'https://sunil-app-xi.vercel.app/installations',
    'https://sunil-app-xi.vercel.app/inventory',
    'https://sunil-app-xi.vercel.app/purchases',
    'https://sunil-app-xi.vercel.app/sales',
    'https://sunil-app-xi.vercel.app/ledger',
    'https://sunil-app-xi.vercel.app/users',
    'https://sunil-app-xi.vercel.app/dealers',
    'https://sunil-app-xi.vercel.app/customers',
    'https://sunil-app-xi.vercel.app/devices'
  ];

  for (const pageUrl of pages) {
    const name = pageUrl.split('/').pop() || 'dashboard';
    const html = await fetchPage(pageUrl, sessionCookie);
    if (html) {
      fs.writeFileSync(path.join(outputDir, `${name}.html`), html);
      console.log(`Saved ${name}.html`);
      
      // Let's also check if it's a Client Component by searching for API calls or script tags.
      // And we can extract some text or structure to understand what data columns exist.
    } else {
      console.log(`Skipped/Failed for ${pageUrl}`);
    }
  }
}

run().catch(console.error);
