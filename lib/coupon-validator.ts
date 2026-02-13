import { supabase } from './supabase';

export interface CouponValidationResult {
  isValid: boolean;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  message: string;
}

export async function validateCoupon(
  couponCode: string,
  planName: string
): Promise<CouponValidationResult> {
  try {
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_coupon_code: couponCode,
      p_plan_name: planName,
    });

    if (error) throw error;

    if (data && data.length > 0) {
      const result = data[0];
      return {
        isValid: result.is_valid,
        discountType: result.discount_type,
        discountValue: result.discount_value,
        message: result.message,
      };
    }

    return {
      isValid: false,
      message: 'Invalid coupon code',
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      isValid: false,
      message: 'Failed to validate coupon',
    };
  }
}

export async function applyCouponDiscount(
  originalPrice: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): Promise<number> {
  if (discountType === 'percentage') {
    return originalPrice * (1 - discountValue / 100);
  } else {
    return Math.max(0, originalPrice - discountValue);
  }
}

export async function incrementCouponUsage(couponCode: string): Promise<void> {
  try {
    await supabase.rpc('increment_coupon_usage', {
      p_coupon_code: couponCode,
    });
  } catch (error) {
    console.error('Error incrementing coupon usage:', error);
  }
}
