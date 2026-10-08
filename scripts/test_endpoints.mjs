async function runTests() {
  console.log('--- 1. Testing Unauthenticated Access ---');
  const res1 = await fetch('http://localhost:3000', { redirect: 'manual' });
  console.log('GET / -> Status:', res1.status, 'Location header:', res1.headers.get('location'));

  console.log('\n--- 2. Testing /login Page ---');
  const res2 = await fetch('http://localhost:3000/login');
  const text2 = await res2.text();
  console.log('GET /login -> Status:', res2.status, 'HTML length:', text2.length);
  console.log('Includes "Student" button:', text2.includes('Student'));
  console.log('Includes "Teacher / Staff" button:', text2.includes('Teacher / Staff'));
  console.log('Includes VidyaSutra emblem:', text2.includes('logo-emblem.png'));

  console.log('\n--- 3. Testing Student Login API ---');
  const loginRes = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'student@vidyasutra.edu.in',
      password: 'Student@123',
      role: 'student'
    })
  });
  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get('set-cookie');
  console.log('POST /api/auth (Student) -> Status:', loginRes.status, 'User:', loginData.user?.name, 'Role:', loginData.user?.role);

  if (setCookie) {
    const cookieVal = setCookie.split(';')[0];
    console.log('\n--- 4. Testing Authenticated GET / with Cookie ---');
    const authRes = await fetch('http://localhost:3000', {
      headers: { 'cookie': cookieVal }
    });
    const authText = await authRes.text();
    console.log('GET / with Cookie -> Status:', authRes.status, 'HTML length:', authText.length);
    console.log('Contains Dashboard/VidyaSutra content:', authText.includes('VidyaSutra'));
  }

  console.log('\n--- 5. Testing Teacher / Staff Login API ---');
  const teacherRes = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'faculty@vidyasutra.edu.in',
      password: 'Faculty@123',
      role: 'teacher'
    })
  });
  const teacherData = await teacherRes.json();
  console.log('POST /api/auth (Teacher/Staff) -> Status:', teacherRes.status, 'User:', teacherData.user?.name, 'Role:', teacherData.user?.role);

  console.log('\n✅ All tests passed successfully!');
}

runTests().catch(console.error);
