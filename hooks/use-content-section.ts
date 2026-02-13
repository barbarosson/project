import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ContentSection {
  id: string;
  section_key: string;
  category: string;
  label_en: string;
  label_tr: string;
  content_en: string;
  content_tr: string;
  content_type: string;
  order_index: number;
  is_active: boolean;
}

interface UseContentSectionReturn {
  content: string;
  contentEn: string;
  contentTr: string;
  loading: boolean;
  error: Error | null;
}

export function useContentSection(
  sectionKey: string,
  language: 'en' | 'tr' = 'en',
  defaultContent?: { en?: string; tr?: string }
): UseContentSectionReturn {
  const [section, setSection] = useState<ContentSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSection = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('content_sections')
          .select('*')
          .eq('section_key', sectionKey)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (isMounted) {
          setSection(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(`Error fetching content section ${sectionKey}:`, err);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSection();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`content-section-${sectionKey}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_sections',
          filter: `section_key=eq.${sectionKey}`,
        },
        (payload) => {
          if (isMounted && payload.new) {
            setSection(payload.new as ContentSection);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [sectionKey]);

  const contentEn = section?.content_en || defaultContent?.en || '';
  const contentTr = section?.content_tr || defaultContent?.tr || '';
  const content = language === 'tr' ? contentTr : contentEn;

  return {
    content,
    contentEn,
    contentTr,
    loading,
    error,
  };
}

// Hook for fetching multiple sections at once
export function useContentSections(
  category: string,
  language: 'en' | 'tr' = 'en'
): { sections: Record<string, string>; loading: boolean; error: Error | null } {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSections = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('content_sections')
          .select('*')
          .eq('category', category)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (fetchError) throw fetchError;

        if (isMounted) {
          setSections(data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(`Error fetching content sections for category ${category}:`, err);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSections();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`content-sections-${category}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_sections',
          filter: `category=eq.${category}`,
        },
        (payload) => {
          if (!isMounted) return;

          if (payload.eventType === 'INSERT') {
            setSections((prev) => [...prev, payload.new as ContentSection]);
          } else if (payload.eventType === 'UPDATE') {
            setSections((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as ContentSection) : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setSections((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [category]);

  const sectionsMap = sections.reduce((acc, section) => {
    const content = language === 'tr' ? section.content_tr : section.content_en;
    acc[section.section_key] = content;
    return acc;
  }, {} as Record<string, string>);

  return {
    sections: sectionsMap,
    loading,
    error,
  };
}
