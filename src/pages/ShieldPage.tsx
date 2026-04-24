import { useEffect, useState } from 'react';
import { ShieldHeader } from '@/components/shield/ShieldHeader';
import { ShieldDashboard } from '@/components/shield/ShieldDashboard';
import { ShieldModes } from '@/components/shield/ShieldModes';
import { ShieldBlocking } from '@/components/shield/ShieldBlocking';
import { ShieldBottomNav } from '@/components/shield/ShieldBottomNav';
import { PermissionOnboarding } from '@/components/mobile/PermissionOnboarding';
import { isNative, isAndroid } from '@/lib/capacitor/platform';
import { StatusBar, Style } from '@capacitor/status-bar';
import Shield from '@/lib/capacitor/shieldPlugin';
import { toast } from 'sonner';

export default function ShieldPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [permOpen, setPermOpen] = useState(false);
  const [isShieldEnabled, setIsShieldEnabled] = useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    accessibility: false,
    usageStats: false,
    overlay: false,
    battery: false
  });

  // ১. স্ট্যাটাস বার এবং প্রাথমিক পারমিশন চেক
  useEffect(() => {
    const initShield = async () => {
      if (isNative) {
        // স্ট্যাটাস বার ডার্ক করা (সাদা বার সমস্যা সমাধান)
        try {
          await StatusBar.setBackgroundColor({ color: '#0F172A' });
          await StatusBar.setStyle({ style: Style.Dark });
        } catch (e) {
          console.warn('StatusBar not available');
        }

        // পারমিশন স্ট্যাটাস চেক
        const perms = await Shield.checkPermissions();
        setPermissions(perms);
        
        // যদি কোনো গুরুত্বপূর্ণ পারমিশন মিস থাকে, তবে অনবোর্ডিং দেখাও
        if (!perms.accessibility || !perms.usageStats || !perms.overlay) {
          setPermOpen(true);
        }

        // শিল্ড কি অন আছে?
        const { enabled } = await Shield.isEnabled();
        setIsShieldEnabled(enabled);

        // ব্লক করা অ্যাপের লিস্ট নিয়ে আসা
        const { apps } = await Shield.getBlockedApps();
        setBlockedApps(apps);
      }
    };

    initShield();
  }, []);

  // ২. অ্যাপ ব্লক বা আনব্লক করার লজিক
  const handleToggleAppBlock = async (pkgName: string) => {
    try {
      let newBlockedList = [...blockedApps];
      if (blockedApps.includes(pkgName)) {
        newApps = blockedApps.filter(a => a !== pkgName);
        toast.info(`${pkgName} removed from block list`);
      } else {
        newApps.push(pkgName);
        toast.success(`${pkgName} is now blocked`);
      }
      
      // সরাসরি নেটিভ প্লাগিনে সেভ করা
      await Shield.blockApps({ apps: newApps });
      setBlockedApps(newApps);
    } catch (error) {
      console.error("Shield Native Error:", error);
      toast.error("Could not update block list");
    }
  };

  // ৩. শিল্ড মাস্টার সুইচ (On/Off)
  const toggleShield = async () => {
    try {
      if (isShieldEnabled) {
        await Shield.disable();
        setIsShieldEnabled(false);
        toast.info("Shield Protection Disabled");
      } else {
        // অন করার আগে পারমিশন চেক
        const perms = await Shield.checkPermissions();
        if (!perms.accessibility) {
          setPermOpen(true);
          toast.error("Accessibility permission required to enable Shield");
          return;
        }
        await Shield.enable();
        setIsShieldEnabled(true);
        toast.success("Shield Protection Active");
      }
    } catch (error) {
      toast.error("Failed to toggle Shield");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pb-24">
      <ShieldHeader 
        isEnabled={isShieldEnabled} 
        onToggle={toggleShield} 
      />
      
      <main className="px-4 pt-4 space-y-6">
        {activeTab === 'dashboard' && (
          <>
            <ShieldDashboard />
            <ShieldModes />
          </>
        )}
        
        {activeTab === 'blocking' && (
          <ShieldBlocking 
            blockedApps={blockedApps} 
            onToggleApp={handleToggleAppBlock} 
          />
        )}
      </main>

      <PermissionOnboarding 
        open={permOpen} 
        onClose={() => setPermOpen(false)} 
        feature="shield" 
      />

      <ShieldBottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
}
