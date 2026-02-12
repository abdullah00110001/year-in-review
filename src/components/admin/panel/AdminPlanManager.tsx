import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Crown, Star, Zap } from 'lucide-react';

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
  is_active: boolean;
}

export default function AdminPlanManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    plan_key: '', name: '', description: '', tier: 'free',
    price_monthly: 0, price_yearly: 0, price_lifetime: 0,
    features: '', is_active: true, stripe_price_id: '',
    price_bdt_monthly: 0,
  });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly');
    if (!error) setPlans((data || []).map(p => ({ ...p, features: (p.features as string[]) || [] })) as Plan[]);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingPlan(null);
    setForm({ plan_key: '', name: '', description: '', tier: 'free', price_monthly: 0, price_yearly: 0, price_lifetime: 0, features: '', is_active: true, stripe_price_id: '', price_bdt_monthly: 0 });
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      plan_key: plan.plan_key, name: plan.name, description: plan.description || '',
      tier: plan.tier, price_monthly: plan.price_monthly || 0, price_yearly: plan.price_yearly || 0,
      price_lifetime: plan.price_lifetime || 0, features: plan.features.join('\n'),
      is_active: plan.is_active, stripe_price_id: plan.stripe_price_id || '',
      price_bdt_monthly: (plan.region_pricing as any)?.bdt_monthly || 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const featuresArr = form.features.split('\n').filter(f => f.trim());
    const payload = {
      plan_key: form.plan_key.toLowerCase().replace(/\s+/g, '_'),
      name: form.name, description: form.description || null, tier: form.tier,
      price_monthly: form.price_monthly, price_yearly: form.price_yearly,
      price_lifetime: form.price_lifetime, features: featuresArr as any,
      is_active: form.is_active, stripe_price_id: form.stripe_price_id || null,
      region_pricing: { bdt_monthly: form.price_bdt_monthly } as any,
    };

    try {
      if (editingPlan) {
        const { error } = await supabase.from('subscription_plans').update(payload).eq('id', editingPlan.id);
        if (error) throw error;
        toast.success('Plan updated');
      } else {
        const { error } = await supabase.from('subscription_plans').insert(payload);
        if (error) throw error;
        toast.success('Plan created');
      }
      setDialogOpen(false);
      fetchPlans();
    } catch (error) {
      toast.error('Failed to save plan');
    }
  };

  const getPlanIcon = (tier: string) => {
    if (tier === 'free') return <Zap className="h-5 w-5 text-muted-foreground" />;
    if (tier === 'premium') return <Star className="h-5 w-5 text-primary" />;
    return <Crown className="h-5 w-5 text-amber-500" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Manage pricing tiers and features</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Plan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Key</Label>
                  <Input value={form.plan_key} onChange={e => setForm(p => ({ ...p, plan_key: e.target.value }))} placeholder="premium" disabled={!!editingPlan} />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Premium" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Best for serious users" />
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <div className="flex gap-2">
                  {['free', 'premium', 'ultimate'].map(t => (
                    <Button key={t} size="sm" variant={form.tier === t ? 'default' : 'outline'} onClick={() => setForm(p => ({ ...p, tier: t }))} className="capitalize">{t}</Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly (USD)</Label>
                  <Input type="number" value={form.price_monthly} onChange={e => setForm(p => ({ ...p, price_monthly: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Monthly (BDT)</Label>
                  <Input type="number" value={form.price_bdt_monthly} onChange={e => setForm(p => ({ ...p, price_bdt_monthly: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Yearly (USD)</Label>
                  <Input type="number" value={form.price_yearly} onChange={e => setForm(p => ({ ...p, price_yearly: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Lifetime (USD)</Label>
                  <Input type="number" value={form.price_lifetime} onChange={e => setForm(p => ({ ...p, price_lifetime: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stripe Price ID</Label>
                <Input value={form.stripe_price_id} onChange={e => setForm(p => ({ ...p, stripe_price_id: e.target.value }))} placeholder="price_..." />
              </div>
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea rows={5} value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} placeholder="Unlimited analytics&#10;Priority support&#10;Advanced insights" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading plans...</p>
        ) : plans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No plans created yet</p>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create First Plan</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className={`p-4 rounded-lg border ${!plan.is_active ? 'opacity-50' : ''} ${plan.tier === 'premium' ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(plan.tier)}
                    <h3 className="font-semibold">{plan.name}</h3>
                  </div>
                  <Badge variant={plan.tier === 'premium' ? 'default' : plan.tier === 'ultimate' ? 'destructive' : 'secondary'} className="capitalize">
                    {plan.tier}
                  </Badge>
                </div>
                {plan.description && <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>}
                <div className="mb-3">
                  {plan.price_monthly ? (
                    <p className="text-2xl font-bold">${plan.price_monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  ) : (
                    <p className="text-2xl font-bold">Free</p>
                  )}
                  {(plan.region_pricing as any)?.bdt_monthly > 0 && (
                    <p className="text-sm text-muted-foreground">৳{(plan.region_pricing as any).bdt_monthly}/mo</p>
                  )}
                </div>
                <div className="space-y-1 mb-4">
                  {plan.features.slice(0, 5).map((f, j) => (
                    <p key={j} className="text-xs text-muted-foreground">✓ {f}</p>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(plan)}>
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
