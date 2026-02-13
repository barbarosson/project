import { Metadata } from 'next';
import { LandingV2Client } from '@/components/marketing/landing-v2-client';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Modulus ERP - Complete Business Management Solution',
    description: 'Streamline your business operations with our all-in-one ERP system',
    openGraph: {
      title: 'Modulus ERP',
      description: 'Complete business management solution',
      images: ['/logo_slogan_ingilizce.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Modulus ERP',
      description: 'Complete business management solution',
      images: ['/logo_slogan_ingilizce.png'],
    },
  };
}

export default async function LandingV2Page() {
  return <LandingV2Client />;
}
