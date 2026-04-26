@NonNull
@Override
    public Result doWork() {
        ShieldPreferences preferences = new ShieldPreferences(getApplicationContext());
        
        // ১. আজকের তারিখ নেওয়া
        String yesterdayDate = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        
        // ২. আজকের টোটাল ইউজ হিস্ট্রিতে সেভ করা
        long totalMinutesUsedToday = preferences.getTodayTotalMinutes();
        preferences.saveDailyHistory(yesterdayDate, totalMinutesUsedToday);
        
        // ৩. নতুন দিনের জন্য কাউন্টার ০ করে দেওয়া
        preferences.setTodayTotalMinutes(0);
        
        // ৪. নেক্সট ডে'র জন্য তারিখ আপডেট করা
        String todayDate = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        preferences.setLastResetDate(todayDate);

        Log.d("ShieldReset", "✅ Midnight Reset Complete. Stats saved for " + yesterdayDate);
        return Result.success();
    }
