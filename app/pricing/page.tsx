import { Metadata } from 'next';
import { WorldClassPricing } from '@/components/pricing/world-class-pricing';
import { getPageMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('pricing');
}

export default function PricingPage() {
  return <WorldClassPricing />;
}
