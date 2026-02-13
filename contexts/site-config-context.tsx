'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  order_index: number;
}

export interface NavigationMenu {
  id: string;
  label: string;
  slug: string;
  order_index: number;
  is_visible: boolean;
  icon: string | null;
  parent_id: string | null;
}

export interface SiteConfig {
  id: string;
  site_name_en: string;
  site_name_tr: string;
  tagline_en: string;
  tagline_tr: string;
  logo_url: string;
  logo_url_dark: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  info_color?: string;
  text_color?: string;
  text_color_secondary?: string;
  background_color?: string;
  background_gradient?: string;
  card_background?: string;
  navbar_background?: string;
  footer_background?: string;
  link_color?: string;
  hover_color?: string;
  shadow_color?: string;
  heading_font?: string;
  body_font?: string;
  font_size_base?: string;
  border_radius?: string;
  button_radius?: string;
  custom_css?: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;

  trust_badge_en: string;
  trust_badge_tr: string;
  stats_customers_count: number;
  stats_transactions_count: number;
  stats_years_active: number;
  stats_satisfaction_rate: number;

  hero_title_en: string;
  hero_title_tr: string;
  hero_subtitle_en: string;
  hero_subtitle_tr: string;
  hero_cta_text_en: string;
  hero_cta_text_tr: string;
  hero_image_url: string;

  features_title_en: string;
  features_title_tr: string;
  features_subtitle_en: string;
  features_subtitle_tr: string;

  how_it_works_title_en: string;
  how_it_works_title_tr: string;
  how_it_works_subtitle_en: string;
  how_it_works_subtitle_tr: string;

  pricing_title_en: string;
  pricing_title_tr: string;
  pricing_subtitle_en: string;
  pricing_subtitle_tr: string;

  faq_title_en: string;
  faq_title_tr: string;
  faq_subtitle_en: string;
  faq_subtitle_tr: string;

  final_cta_title_en: string;
  final_cta_title_tr: string;
  final_cta_subtitle_en: string;
  final_cta_subtitle_tr: string;
  final_cta_button_text_en: string;
  final_cta_button_text_tr: string;

  social_proof_title_en: string;
  social_proof_title_tr: string;
  social_proof_subtitle_en: string;
  social_proof_subtitle_tr: string;

  meta_title_en: string;
  meta_title_tr: string;
  meta_description_en: string;
  meta_description_tr: string;
  og_image_url: string;
  keywords_en: string;
  keywords_tr: string;

  sticky_bar_enabled: boolean;
  sticky_bar_text_en: string;
  sticky_bar_text_tr: string;
  sticky_bar_bg_color: string;

  popup_enabled: boolean;
  popup_title_en: string;
  popup_title_tr: string;
  popup_content_en: string;
  popup_content_tr: string;
  popup_cta_text_en: string;
  popup_cta_text_tr: string;
  popup_delay_seconds: number;

  video_tutorial_links: Record<string, string>;

  email_welcome_subject_en: string;
  email_welcome_subject_tr: string;
  email_welcome_body_en: string;
  email_welcome_body_tr: string;
  email_invoice_subject_en: string;
  email_invoice_subject_tr: string;
  email_invoice_body_en: string;
  email_invoice_body_tr: string;
  email_low_credit_subject_en: string;
  email_low_credit_subject_tr: string;
  email_low_credit_body_en: string;
  email_low_credit_body_tr: string;

  maintenance_mode: boolean;
  maintenance_message_en: string;
  maintenance_message_tr: string;
  maintenance_allowed_ips: string[];
}

interface SiteConfigContextType {
  config: SiteConfig | null;
  banners: Banner[];
  menus: NavigationMenu[];
  activeBanner: Banner | null;
  visibleMenus: NavigationMenu[];
  loading: boolean;
  bypassMaintenance: boolean;
  refreshConfig: () => Promise<void>;
  refreshBanners: () => Promise<void>;
  refreshMenus: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [menus, setMenus] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [bypassMaintenance, setBypassMaintenance] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setConfig(data);

        // Check if user can bypass maintenance mode
        checkMaintenanceBypass(data);
      }
    } catch (error) {
      console.error('❌ Error fetching site config:', error);
    }
  };

  const checkMaintenanceBypass = async (siteConfig: SiteConfig) => {
    // Always allow access to /admin/* and /login routes
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin') || path === '/login' || path === '/landing') {
        setBypassMaintenance(true);
        return;
      }
    }

    // Check if user is super_admin or admin
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile && (profile.role === 'super_admin' || profile.role === 'admin')) {
          setBypassMaintenance(true);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking maintenance bypass:', error);
    }

    setBypassMaintenance(false);
  };

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const fetchMenus = async (retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('navigation_menus')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchMenus(retryCount + 1);
        }

        throw error;
      }

      setMenus(data || []);
    } catch (error) {
      setMenus([]);
    }
  };

  const refreshConfig = async () => {
    await fetchConfig();
  };

  const refreshBanners = async () => {
    await fetchBanners();
  };

  const refreshMenus = async () => {
    await fetchMenus();
  };

  useEffect(() => {
    if (initialized) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConfig(), fetchBanners(), fetchMenus()]);
      setLoading(false);
      setInitialized(true);
    };

    loadData();

    const configChannel = supabase
      .channel('site_config_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, fetchConfig)
      .subscribe();

    const bannersChannel = supabase
      .channel('banners_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, fetchBanners)
      .subscribe();

    const menusChannel = supabase
      .channel('menus_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'navigation_menus' }, fetchMenus)
      .subscribe();

    const checkInterval = setInterval(() => {
      if (menus.length === 0 && !loading) {
        fetchMenus();
      }
    }, 3000);

    return () => {
      clearInterval(checkInterval);
      supabase.removeChannel(configChannel);
      supabase.removeChannel(bannersChannel);
      supabase.removeChannel(menusChannel);
    };
  }, [initialized, menus.length, loading]);

  const activeBanner = banners.find(b => b.is_active) || null;
  const visibleMenus = menus.filter(m => m.is_visible);

  // Show maintenance page if maintenance mode is enabled and user can't bypass
  if (!loading && config?.maintenance_mode && !bypassMaintenance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-lg shadow-xl p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {config.maintenance_message_en || 'Site Under Maintenance'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            We're performing scheduled maintenance to improve your experience. Please check back soon!
          </p>
          <div className="text-sm text-slate-500 dark:text-slate-500">
            If you're an administrator, please <a href="/admin/login" className="text-primary hover:underline">sign in here</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        banners,
        menus,
        activeBanner,
        visibleMenus,
        loading,
        bypassMaintenance,
        refreshConfig,
        refreshBanners,
        refreshMenus,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
}
