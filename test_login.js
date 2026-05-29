async function run() {
  const formData = new FormData();
  formData.append('mobile', '9761334377');
  formData.append('password', '12345');

  console.log('Sending login request...');
  const res = await fetch('https://sunil-app-xi.vercel.app/api/login', {
    method: 'POST',
    body: formData
  });

  console.log('Status:', res.status);
  console.log('Headers:', [...res.headers.entries()]);
  const json = await res.json();
  console.log('JSON Response:', json);
}

run().catch(console.error);
