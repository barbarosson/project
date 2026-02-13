'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface FAQ {
  id: string;
  question_en: string;
  question_tr: string;
  answer_en: string;
  answer_tr: string;
  category: string;
}

export default function HelpPage() {
  const { language } = useLanguage();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_published', true)
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = faqs.filter((faq) => {
    const question =
      language === 'tr' ? faq.question_tr : faq.question_en;
    const answer = language === 'tr' ? faq.answer_tr : faq.answer_en;
    const query = searchQuery.toLowerCase();
    return (
      question.toLowerCase().includes(query) ||
      answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query)
    );
  });

  const categorizedFAQs = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {language === 'tr' ? 'Yardım Merkezi' : 'Help Center'}
          </h1>
          <p className="text-xl text-[#475569] mb-8">
            {language === 'tr'
              ? 'Sık sorulan soruların cevaplarını bulun'
              : 'Find answers to frequently asked questions'}
          </p>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#475569]" />
            <Input
              type="search"
              placeholder={
                language === 'tr' ? 'Sorularınızı arayın...' : 'Search your questions...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : Object.keys(categorizedFAQs).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-[#475569]">
                {language === 'tr'
                  ? 'Aradığınız soruya uygun sonuç bulunamadı.'
                  : 'No results found for your search.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(categorizedFAQs).map(([category, categoryFAQs]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    {category}
                  </Badge>
                  <span className="text-[#475569] text-sm">
                    {categoryFAQs.length}{' '}
                    {language === 'tr' ? 'soru' : 'questions'}
                  </span>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      {categoryFAQs.map((faq, index) => (
                        <AccordionItem
                          key={faq.id}
                          value={faq.id}
                          className={index === 0 ? 'border-t-0' : ''}
                        >
                          <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/50 transition-colors">
                            <span className="text-left font-medium">
                              {language === 'tr'
                                ? faq.question_tr
                                : faq.question_en}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6 text-[#475569]">
                            {language === 'tr' ? faq.answer_tr : faq.answer_en}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        <Card className="mt-12">
          <CardContent className="py-8 text-center">
            <h3 className="text-lg font-semibold mb-2">
              {language === 'tr'
                ? 'Aradığınızı bulamadınız mı?'
                : "Didn't find what you're looking for?"}
            </h3>
            <p className="text-[#475569] mb-4">
              {language === 'tr'
                ? 'Destek ekibimizle iletişime geçin'
                : 'Get in touch with our support team'}
            </p>
            <a
              href="/support"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {language === 'tr' ? 'Destek Talebi Oluştur' : 'Contact Support'}
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
}
