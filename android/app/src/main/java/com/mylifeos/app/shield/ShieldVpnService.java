package com.mylifeos.app.shield;

import android.content.Intent;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import android.util.Log;
import java.io.IOException;

public class ShieldVpnService extends VpnService {
    private static final String TAG = "ShieldVPN";
    private Thread vpnThread;
    private ParcelFileDescriptor vpnInterface = null;
    
    // রিঅ্যাক্ট থেকে এই সার্ভিস অন/অফ করার সিগন্যাল
    public static final String ACTION_START = "com.mylifeos.START_VPN";
    public static final String ACTION_STOP = "com.mylifeos.STOP_VPN";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopVpn();
            return START_NOT_STICKY;
        }
        
        // ভিপিএন স্টার্ট করা
        if (vpnThread == null || !vpnThread.isAlive()) {
            startVpn();
        }
        return START_STICKY;
    }

    private void startVpn() {
        vpnThread = new Thread(() -> {
            try {
                Builder builder = new Builder();
                
                // ==========================================
                // 🛡️ Cloudflare Family Safe DNS (The Magic Engine)
                // ==========================================
                // এই DNS গুলো অটোমেটিক্যালি অ্যাডাল্ট কন্টেন্ট এবং ম্যালওয়্যার ব্লক করে
                builder.addDnsServer("1.1.1.3");
                builder.addDnsServer("1.0.0.3");
                
                // IPv6 সাপোর্ট
                builder.addDnsServer("2606:4700:4700::1113");
                builder.addDnsServer("2606:4700:4700::1003");

                // লোকাল ডামি IP (VPN এস্টাবলিশ করার জন্য রিকোয়ার্ড)
                builder.addAddress("10.0.0.2", 24);
                
                // VPN এর নাম যা ইউজারের সেটিংসে দেখাবে
                builder.setSession("LifeOS Shield Filter");
                builder.setMtu(1500);
                
                // (নোট: প্রোডাকশনে পুরো ট্রাফিক রাউট করতে চাইলে tun2socks এর মতো প্যাকেট ফরোয়ার্ডার লাগে। 
                // আপাতত আমরা শুধু VPN আইকন এবং DNS অ্যাক্টিভ করছি)

                // 🟢 কানেকশন এস্টাবলিশ করা (স্ট্যাটাস বারে চাবির আইকন আসবে)
                vpnInterface = builder.establish();
                Log.d(TAG, "🛡️ Shield Adult Filter VPN Started Successfully!");

                // ব্যাকগ্রাউন্ডে সার্ভিসটা বাঁচিয়ে রাখার লুপ
                while (!Thread.currentThread().isInterrupted()) {
                    Thread.sleep(2000); 
                }

            } catch (Exception e) {
                Log.e(TAG, "Failed to start Adult Filter VPN", e);
            } finally {
                stopVpn();
            }
        }, "ShieldVpnThread");
        
        vpnThread.start();
    }

    private void stopVpn() {
        try {
            if (vpnInterface != null) {
                vpnInterface.close();
                vpnInterface = null;
            }
            if (vpnThread != null) {
                vpnThread.interrupt();
                vpnThread = null;
            }
            Log.d(TAG, "🛑 Shield Adult Filter VPN Stopped!");
        } catch (IOException e) {
            Log.e(TAG, "Error closing VPN interface", e);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopVpn();
    }
}
