import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Crown, Check, Zap, Star, Ticket, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Plan {
  id: string;
  plan_key: string;
  name: string;
  description: string | null;
  tier: string;
  price_monthly: number | null;
  price_yearly: number | null;
  price_lifetime: number | null;
  features: string[];
  region_pricing: Record<string, any> | null;
  stripe_price_id: string | null;
}

export default function Premium() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ discount_type: string; discount_value: number } | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly');
    setPlans((data || []).map(p => ({ ...p, features: (p.features as string[]) || [] })) as Plan[]);
    setLoading(false);
  };

  const fetchCurrentSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (data) {
      setCurrentPlan((data.subscription_plans as any)?.tier || 'free');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      toast.error('Invalid or expired coupon');
      return;
    }
    if (data.max_uses && data.uses_count >= data.max_uses) {
      toast.error('Coupon usage limit reached');
      return;
    }
    setCouponApplied({ discount_type: data.discount_type || 'percentage', discount_value: data.discount_value });
    toast.success(`Coupon applied! ${data.discount_type === 'percentage' ? `${data.discount_value}% off` : `$${data.discount_value} off`}`);
  };

  const getDiscountedPrice = (price: number) => {
    if (!couponApplied) return price;
    if (couponApplied.discount_type === 'percentage') {
      return price * (1 - couponApplied.discount_value / 100);
    }
    return Math.max(0, price - couponApplied.discount_value);
  };

  const handleSubscribe = async (plan: Plan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }

    // Check provider settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'payment_providers')
      .maybeSingle();

    const providers = settings?.value as Record<string, any> | null;
    const stripeEnabled = providers?.stripe?.enabled && providers?.stripe?.secret_key;
    const bkashEnabled = providers?.bkash?.enabled && providers?.bkash?.secret_key;
    const nagadEnabled = providers?.nagad?.enabled && providers?.nagad?.secret_key;

    if (!stripeEnabled && !bkashEnabled && !nagadEnabled) {
      toast.error('Payment system is not configured yet. Please contact admin.');
      return;
    }

    // For now, create a pending transaction
    const price = plan.price_monthly || 0;
    const finalPrice = getDiscountedPrice(price);

    const { error } = await supabase.from('payment_transactions').insert({
      user_id: user.id,
      amount: finalPrice,
      currency: 'USD',
      payment_provider: stripeEnabled ? 'stripe' : bkashEnabled ? 'bkash' : 'nagad',
      status: 'pending',
      metadata: { plan_id: plan.id, coupon_applied: couponApplied } as any,
    });

    if (error) {
      toast.error('Failed to initiate payment');
      return;
    }

    toast.success('Payment initiated! Processing...');
    // In a real implementation, this would redirect to Stripe/bKash checkout
  };

  const getPlanIcon = (tier: string) => {
    if (tier === 'free') return <Zap className="h-8 w-8 text-muted-foreground" />;
    if (tier === 'premium') return <Star className="h-8 w-8 text-primary" />;
    return <Crown className="h-8 w-8 text-amber-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Upgrade Your Life OS</h1>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Unlock powerful features to supercharge your productivity and spiritual growth
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.tier;
            const price = plan.price_monthly || 0;
            const finalPrice = getDiscountedPrice(price);
            const hasDiscount = couponApplied && price > 0;

            return (
              <Card key={plan.id} className={`relative ${plan.tier === 'premium' ? 'border-primary ring-2 ring-primary/20' : ''} ${isCurrentPlan ? 'bg-primary/5' : ''}`}>
                {plan.tier === 'premium' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-3">{getPlanIcon(plan.tier)}</div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    {price > 0 ? (
                      <>
                        {hasDiscount && (
                          <p className="text-sm line-through text-muted-foreground">${price}/mo</p>
                        )}
                        <p className="text-3xl font-bold">
                          ${finalPrice.toFixed(2)}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                        {(plan.region_pricing as any)?.bdt_monthly > 0 && (
                          <p className="text-sm text-muted-foreground">
                            ৳{hasDiscount ? getDiscountedPrice((plan.region_pricing as any).bdt_monthly).toFixed(0) : (plan.region_pricing as any).bdt_monthly}/mo
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-3xl font-bold">Free</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={plan.tier === 'premium' ? 'default' : 'outline'}
                    disabled={isCurrentPlan || plan.tier === 'free'}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.tier === 'free' ? 'Free Forever' : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coupon */}
        <Card className="max-w-md mx-auto">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={applyCoupon} variant="outline" size="sm">Apply</Button>
            </div>
            {couponApplied && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <Check className="h-3 w-3" />
                {couponApplied.discount_type === 'percentage' ? `${couponApplied.discount_value}% discount applied` : `$${couponApplied.discount_value} discount applied`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
