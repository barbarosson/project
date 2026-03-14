import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getPageMetadata } from '@/lib/metadata';

const WorldClassPricing = dynamic(
  () => import('@/components/pricing/world-class-pricing').then((m) => m.WorldClassPricing),
  { ssr: true, loading: () => <div className="min-h-[60vh] flex items-center justify-center" /> }
);

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('pricing');
}

export default function PricingPage() {
  return <WorldClassPricing />;
}
