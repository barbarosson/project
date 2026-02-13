export function logStorageState() {
  if (typeof window === 'undefined') {
    console.log('📦 [Storage Debug] Server-side - no storage available');
    return;
  }

  console.log('📦 [Storage Debug] Current storage state:');

  try {
    const allKeys = Object.keys(localStorage);
    console.log('  Total localStorage keys:', allKeys.length);

    const authKeys = allKeys.filter(k =>
      k.includes('supabase') || k.includes('auth') || k.includes('sb-')
    );

    if (authKeys.length === 0) {
      console.log('  ❌ No auth-related keys found in localStorage');
    } else {
      console.log('  ✅ Auth-related keys:', authKeys.length);
      authKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`    - ${key}: ${value ? `${value.substring(0, 50)}...` : 'null'}`);
      });
    }
  } catch (e) {
    console.error('  ❌ localStorage access failed:', e);
  }

  try {
    const cookies = document.cookie.split(';').map(c => c.trim());
    console.log('  Total cookies:', cookies.length);

    const authCookies = cookies.filter(c => {
      const name = c.split('=')[0];
      return name.includes('supabase') || name.includes('auth') || name.includes('sb-');
    });

    if (authCookies.length === 0) {
      console.log('  ❌ No auth-related cookies found');
    } else {
      console.log('  ✅ Auth-related cookies:', authCookies.length);
      authCookies.forEach(cookie => {
        const [name, value] = cookie.split('=');
        console.log(`    - ${name}: ${value ? `${value.substring(0, 50)}...` : 'null'}`);
      });
    }
  } catch (e) {
    console.error('  ❌ Cookie access failed:', e);
  }
}

export function testStorageAvailability() {
  console.log('🔍 [Storage Test] Testing storage availability...');

  const results = {
    localStorage: false,
    sessionStorage: false,
    cookies: false,
  };

  if (typeof window === 'undefined') {
    console.log('  ❌ Server-side environment - no storage available');
    return results;
  }

  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    results.localStorage = retrieved === 'test';
    console.log(`  ${results.localStorage ? '✅' : '❌'} localStorage:`, results.localStorage);
  } catch (e) {
    console.log('  ❌ localStorage: false (error:', (e as Error).message, ')');
  }

  try {
    const testKey = '__storage_test__';
    sessionStorage.setItem(testKey, 'test');
    const retrieved = sessionStorage.getItem(testKey);
    sessionStorage.removeItem(testKey);
    results.sessionStorage = retrieved === 'test';
    console.log(`  ${results.sessionStorage ? '✅' : '❌'} sessionStorage:`, results.sessionStorage);
  } catch (e) {
    console.log('  ❌ sessionStorage: false (error:', (e as Error).message, ')');
  }

  try {
    document.cookie = '__cookie_test__=test; path=/';
    results.cookies = document.cookie.includes('__cookie_test__');
    document.cookie = '__cookie_test__=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    console.log(`  ${results.cookies ? '✅' : '❌'} cookies:`, results.cookies);
  } catch (e) {
    console.log('  ❌ cookies: false (error:', (e as Error).message, ')');
  }

  return results;
}

export async function testSupabaseAuth(supabase: any) {
  console.log('🔍 [Auth Test] Testing Supabase authentication...');

  if (!supabase) {
    console.error('  ❌ Supabase client not initialized');
    return false;
  }
  console.log('  ✅ Supabase client exists');

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('  ❌ getSession error:', error.message);
      return false;
    }

    if (session) {
      console.log('  ✅ Session exists');
      console.log('    - User ID:', session.user?.id);
      console.log('    - Email:', session.user?.email);
      console.log('    - Expires at:', new Date(session.expires_at || 0).toISOString());
      console.log('    - Access token length:', session.access_token?.length || 0);
      return true;
    } else {
      console.log('  ⚠️  No active session (user not logged in)');
      return false;
    }
  } catch (e) {
    console.error('  ❌ Unexpected error:', e);
    return false;
  }
}

export function runFullDiagnostics(supabase: any) {
  console.log('🔬 [Full Diagnostics] Running comprehensive auth diagnostics...');
  console.log('━'.repeat(60));

  testStorageAvailability();
  console.log('━'.repeat(60));

  logStorageState();
  console.log('━'.repeat(60));

  testSupabaseAuth(supabase);
  console.log('━'.repeat(60));

  console.log('✅ [Full Diagnostics] Complete');
}
