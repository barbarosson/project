import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
}

export async function verifyAdminRequest(
  request: NextRequest
): Promise<{ user: AdminUser | null; error: string | null }> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return { user: null, error: 'Invalid or expired token' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { user: null, error: 'Profile not found' };
    }

    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return { user: null, error: 'Insufficient permissions' };
    }

    return {
      user: {
        id: user.id,
        email: user.email!,
        role: profile.role,
      },
      error: null,
    };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, adminUser: AdminUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const { user, error } = await verifyAdminRequest(request);

  if (error || !user) {
    return NextResponse.json(
      { error: error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return handler(request, user);
}

export async function withSuperAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, adminUser: AdminUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const { user, error } = await verifyAdminRequest(request);

  if (error || !user) {
    return NextResponse.json(
      { error: error || 'Unauthorized' },
      { status: 401 }
    );
  }

  if (user.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Super admin access required' },
      { status: 403 }
    );
  }

  return handler(request, user);
}
