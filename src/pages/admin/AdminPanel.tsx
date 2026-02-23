import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminUserManagement from '@/components/admin/panel/AdminUserManagement';
import AdminRoleManagement from '@/components/admin/panel/AdminRoleManagement';
import AdminFeatureControl from '@/components/admin/panel/AdminFeatureControl';
import AdminAlarmControl from '@/components/admin/panel/AdminAlarmControl';
import AdminShieldControl from '@/components/admin/panel/AdminShieldControl';
import AdminGroupControl from '@/components/admin/panel/AdminGroupControl';
import AdminBehaviorRules from '@/components/admin/panel/AdminBehaviorRules';
import AdminAIControl from '@/components/admin/panel/AdminAIControl';
import AdminPayments from '@/components/admin/panel/AdminPayments';
import AdminEntitlements from '@/components/admin/panel/AdminEntitlements';
import AdminRevenue from '@/components/admin/panel/AdminRevenue';
import AdminAnalytics from '@/components/admin/panel/AdminAnalytics';
import AdminDeviceIntelligence from '@/components/admin/panel/AdminDeviceIntelligence';
import AdminAuditLogs from '@/components/admin/panel/AdminAuditLogs';
import AdminSystemHealth from '@/components/admin/panel/AdminSystemHealth';
import AdminGovernance from '@/components/admin/panel/AdminGovernance';
import AdminCompliance from '@/components/admin/panel/AdminCompliance';
import AdminLifeIntelligence from '@/components/admin/panel/AdminLifeIntelligence';
import AdminProductivityEngine from '@/components/admin/panel/AdminProductivityEngine';
import AdminChallenges from '@/components/admin/panel/AdminChallenges';
import AdminSafetyEthics from '@/components/admin/panel/AdminSafetyEthics';
import AdminAppUpdates from '@/components/admin/panel/AdminAppUpdates';

const tabComponents: Record<string, React.ComponentType> = {
  users: AdminUserManagement,
  roles: AdminRoleManagement,
  features: AdminFeatureControl,
  alarm: AdminAlarmControl,
  shield: AdminShieldControl,
  groups: AdminGroupControl,
  behavior: AdminBehaviorRules,
  ai: AdminAIControl,
  life: AdminLifeIntelligence,
  productivity: AdminProductivityEngine,
  challenges: AdminChallenges,
  safety: AdminSafetyEthics,
  payments: AdminPayments,
  entitlements: AdminEntitlements,
  revenue: AdminRevenue,
  analytics: AdminAnalytics,
  devices: AdminDeviceIntelligence,
  audit: AdminAuditLogs,
  health: AdminSystemHealth,
  governance: AdminGovernance,
  compliance: AdminCompliance,
  updates: AdminAppUpdates,
};

export default function AdminPanel() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';

  const ActiveComponent = tabComponents[activeTab] || AdminUserManagement;

  return (
    <AdminLayout>
      <div className="max-w-[1800px] mx-auto">
        <ActiveComponent />
      </div>
    </AdminLayout>
  );
}
