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

  const outputDir = path.join(__dirname, 'scraped_html');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const pages = [
    'https://sunil-app-xi.vercel.app/companies/bfae3ece-8534-4ce3-b12e-e00eae1982f0',
    'https://sunil-app-xi.vercel.app/agents/56582f1e-1fb4-4246-be46-8cf787d87f28'
  ];

  for (const pageUrl of pages) {
    const segments = pageUrl.split('/');
    const id = segments.pop();
    const type = segments.pop();
    const html = await fetchPage(pageUrl, sessionCookie);
    if (html) {
      fs.writeFileSync(path.join(outputDir, `${type}_detail_${id}.html`), html);
      console.log(`Saved ${type}_detail_${id}.html`);
    } else {
      console.log(`Failed for ${pageUrl}`);
    }
  }
}

run().catch(console.error);
