export interface AIGenerateOptions {
  type: 'slogan' | 'banner_text' | 'blog_description' | 'meta_description' | 'translate';
  context?: string;
  language?: 'en' | 'tr';
  sourceText?: string;
  targetLanguage?: 'en' | 'tr';
}

export async function generateAIContent(options: AIGenerateOptions): Promise<string> {
  const prompts = {
    slogan: (lang: string) => `Generate a catchy, professional slogan for a business ERP system. Language: ${lang}. Keep it under 10 words.`,
    banner_text: (lang: string, ctx?: string) =>
      `Generate compelling banner text for a business ERP system${ctx ? ` about: ${ctx}` : ''}. Language: ${lang}. Keep it under 100 characters.`,
    blog_description: (lang: string, ctx?: string) =>
      `Generate a brief, engaging blog post description${ctx ? ` about: ${ctx}` : ''}. Language: ${lang}. Keep it under 200 characters.`,
    meta_description: (lang: string, ctx?: string) =>
      `Generate an SEO-optimized meta description for a business ERP system${ctx ? ` focusing on: ${ctx}` : ''}. Language: ${lang}. Keep it between 150-160 characters.`,
    translate: (text: string, targetLang: string) =>
      `Translate the following text to ${targetLang === 'tr' ? 'Turkish' : 'English'}. Keep the same tone and style: "${text}"`,
  };

  let prompt = '';

  if (options.type === 'translate' && options.sourceText && options.targetLanguage) {
    prompt = prompts.translate(options.sourceText, options.targetLanguage);
  } else {
    const lang = options.language === 'tr' ? 'Turkish' : 'English';
    const ctx = options.context;

    if (options.type === 'slogan') {
      prompt = prompts.slogan(lang);
    } else if (options.type === 'banner_text') {
      prompt = prompts.banner_text(lang, ctx);
    } else if (options.type === 'blog_description') {
      prompt = prompts.blog_description(lang, ctx);
    } else if (options.type === 'meta_description') {
      prompt = prompts.meta_description(lang, ctx);
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional marketing copywriter specializing in business software. Generate concise, compelling content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error('AI generation failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('AI content generation error:', error);
    throw new Error('Failed to generate AI content. Please try again.');
  }
}

export async function generateMultilingualContent(
  type: 'slogan' | 'banner_text' | 'blog_description' | 'meta_description',
  context?: string
): Promise<{ en: string; tr: string }> {
  const [en, tr] = await Promise.all([
    generateAIContent({ type, language: 'en', context }),
    generateAIContent({ type, language: 'tr', context }),
  ]);

  return { en, tr };
}

export async function translateText(
  sourceText: string,
  targetLanguage: 'en' | 'tr'
): Promise<string> {
  return generateAIContent({
    type: 'translate',
    sourceText,
    targetLanguage,
  });
}
