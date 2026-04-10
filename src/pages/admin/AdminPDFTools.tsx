import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PDFToolType } from '@/types/pdf';
import { 
  DollarSign, 
  Users, 
  FileText, 
  TrendingUp,
  Crown,
  Wallet,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface ToolConfig {
  id: string;
  tool_type: PDFToolType;
  name: string;
  description: string | null;
  icon: string;
  is_premium: boolean;
  base_credits: number;
  credits_per_mb: number;
  max_free_size_mb: number;
  is_enabled: boolean;
  sort_order: number;
}

interface WalletStats {
  totalUsers: number;
  totalCredits: number;
  premiumUsers: number;
  avgBalance: number;
}

interface AdConfig {
  id: string;
  placement: string;
  is_enabled: boolean;
  ad_code: string | null;
  watch_duration_seconds: number;
  credits_reward: number;
}

export default function AdminPDFTools() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [toolConfigs, setToolConfigs] = useState<ToolConfig[]>([]);
  const [adConfigs, setAdConfigs] = useState<AdConfig[]>([]);
  const [walletStats, setWalletStats] = useState<WalletStats>({
    totalUsers: 0,
    totalCredits: 0,
    premiumUsers: 0,
    avgBalance: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Array<{
    id: string;
    user_id: string;
    transaction_type: string;
    amount: number;
    tool_used: string | null;
    created_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch tool configs
      const { data: tools } = await supabase
        .from('pdf_tool_configs')
        .select('*')
        .order('sort_order');
      if (tools) setToolConfigs(tools as unknown as ToolConfig[]);

      // Fetch ad configs
      const { data: ads } = await supabase
        .from('ad_configurations')
        .select('*');
      if (ads) setAdConfigs(ads as unknown as AdConfig[]);

      // Fetch wallet stats
      const { data: wallets } = await supabase
        .from('user_wallets')
        .select('balance, is_premium');
      
      if (wallets) {
        const total = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
        const premium = wallets.filter(w => w.is_premium).length;
        setWalletStats({
          totalUsers: wallets.length,
          totalCredits: total,
          premiumUsers: premium,
          avgBalance: wallets.length > 0 ? Math.round(total / wallets.length) : 0
        });
      }

      // Fetch recent transactions
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (transactions) setRecentTransactions(transactions as typeof recentTransactions);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateToolConfig = async (id: string, updates: Partial<ToolConfig>) => {
    try {
      const { error } = await supabase
        .from('pdf_tool_configs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setToolConfigs(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );

      toast({
        title: 'Tool Updated',
        description: 'Configuration saved successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tool configuration',
        variant: 'destructive'
      });
    }
  };

  const updateAdConfig = async (id: string, updates: Partial<AdConfig>) => {
    try {
      const { error } = await supabase
        .from('ad_configurations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setAdConfigs(prev => 
        prev.map(a => a.id === id ? { ...a, ...updates } : a)
      );

      toast({
        title: 'Ad Config Updated',
        description: 'Configuration saved successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update ad configuration',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">BlackBox PDF Admin</h1>
            <p className="text-muted-foreground">
              Manage PDF tools, credits, and monetization
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{walletStats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Wallet className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold">{walletStats.totalCredits.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Crown className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Premium Users</p>
                  <p className="text-2xl font-bold">{walletStats.premiumUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Balance</p>
                  <p className="text-2xl font-bold">{walletStats.avgBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tools">
              <FileText className="w-4 h-4 mr-2" />
              Tool Pricing
            </TabsTrigger>
            <TabsTrigger value="ads">
              <DollarSign className="w-4 h-4 mr-2" />
              Ad Configuration
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <Wallet className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest credit transactions across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.slice(0, 10).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant={tx.amount > 0 ? 'default' : 'secondary'}>
                            {tx.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{tx.tool_used || '-'}</TableCell>
                        <TableCell className={tx.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tool Pricing Configuration</CardTitle>
                <CardDescription>Configure credits and pricing for each PDF tool</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Base Credits</TableHead>
                      <TableHead>Credits/MB</TableHead>
                      <TableHead>Free Limit (MB)</TableHead>
                      <TableHead>Enabled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toolConfigs.map((tool) => (
                      <TableRow key={tool.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{tool.icon}</span>
                            <span className="font-medium">{tool.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={tool.is_premium}
                            onCheckedChange={(checked) => 
                              updateToolConfig(tool.id, { is_premium: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={tool.base_credits}
                            onChange={(e) => 
                              updateToolConfig(tool.id, { base_credits: parseInt(e.target.value) || 0 })
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            value={tool.credits_per_mb}
                            onChange={(e) => 
                              updateToolConfig(tool.id, { credits_per_mb: parseFloat(e.target.value) || 0 })
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={tool.max_free_size_mb}
                            onChange={(e) => 
                              updateToolConfig(tool.id, { max_free_size_mb: parseInt(e.target.value) || 0 })
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={tool.is_enabled}
                            onCheckedChange={(checked) => 
                              updateToolConfig(tool.id, { is_enabled: checked })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advertisement Configuration</CardTitle>
                <CardDescription>Control ad placements and watch-to-unlock rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {adConfigs.map((ad) => (
                  <div key={ad.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">{ad.placement.replace('_', ' ')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {ad.watch_duration_seconds > 0 
                            ? `Watch ${ad.watch_duration_seconds}s to earn ${ad.credits_reward} credits`
                            : 'Display ad only'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={ad.is_enabled}
                        onCheckedChange={(checked) => 
                          updateAdConfig(ad.id, { is_enabled: checked })
                        }
                      />
                    </div>
                    
                    {ad.watch_duration_seconds > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Watch Duration (s)</label>
                          <Input
                            type="number"
                            value={ad.watch_duration_seconds}
                            onChange={(e) => 
                              updateAdConfig(ad.id, { watch_duration_seconds: parseInt(e.target.value) || 30 })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Credit Reward</label>
                          <Input
                            type="number"
                            value={ad.credits_reward}
                            onChange={(e) => 
                              updateAdConfig(ad.id, { credits_reward: parseInt(e.target.value) || 5 })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Log</CardTitle>
                <CardDescription>Complete audit trail of all credit transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">
                          {tx.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.amount > 0 ? 'default' : 'secondary'}>
                            {tx.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{tx.tool_used || '-'}</TableCell>
                        <TableCell className={tx.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
