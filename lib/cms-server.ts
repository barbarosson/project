import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for fetching CMS data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

export async function getCMSBanners(isActive = true) {
  let query = supabaseServer
    .from('cms_banners')
    .select('*')
    .order('order_index', { ascending: true });

  if (isActive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching CMS banners:', error);
    return [];
  }

  return data || [];
}

export async function getSiteConfig() {
  const { data, error } = await supabaseServer
    .from('site_config')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching site config:', error);
    return null;
  }

  return data;
}

export async function getUIStyles() {
  const { data, error } = await supabaseServer
    .from('ui_styles')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching UI styles:', error);
    return null;
  }

  return data;
}
