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
    throw new Error('Login failed');
  }

  const setCookie = loginRes.headers.get('set-cookie');
  const cookieMatch = setCookie.match(/sessionToken=[^;]+/);
  const sessionCookie = cookieMatch[0];
  console.log('Session Cookie obtained.');

  const outputDir = path.join(__dirname, 'scraped_html');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const pages = [
    'https://sunil-app-xi.vercel.app/companies',
    'https://sunil-app-xi.vercel.app/agents',
    'https://sunil-app-xi.vercel.app/reports'
  ];

  for (const pageUrl of pages) {
    const name = pageUrl.split('/').pop();
    const html = await fetchPage(pageUrl, sessionCookie);
    if (html) {
      fs.writeFileSync(path.join(outputDir, `${name}.html`), html);
      console.log(`Saved ${name}.html`);
    } else {
      console.log(`Failed for ${pageUrl}`);
    }
  }
}

run().catch(console.error);
