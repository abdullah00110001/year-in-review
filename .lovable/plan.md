

# Fix: App Crashes After Login on Native

## Root Cause

When a user logs in, the app navigates to `/dashboard`. The Dashboard renders inside `AppModeProvider`, which immediately queries:

```
supabase.from('profiles').select('app_mode').eq('user_id', ...).single()
```

**There is no database trigger to auto-create a profile row for new users.** The `.single()` call throws a `PGRST116` error ("no rows returned") when no profile exists. On the web browser, this error is silently swallowed. On the native Android WebView, unhandled promise rejections can crash the entire WebView, closing the app.

Additionally, `Auth.tsx` calls `supabase.rpc('get_user_role')` during redirect, which adds another potential failure point before the dashboard loads.

## Fix Plan (4 changes)

### 1. Create auto-profile trigger in database
Add a SQL migration that creates a database trigger on `auth.users`. When a new user signs up, a `profiles` row is automatically created. This prevents the missing-row crash permanently.

### 2. Fix AppModeContext.tsx -- replace `.single()` with `.maybeSingle()`
Change line 254 from `.single()` to `.maybeSingle()` so that a missing profile row returns `null` instead of throwing an error. Add a fallback to create the profile row if it doesn't exist.

### 3. Harden Auth.tsx redirect -- wrap RPC call safely
The `get_user_role` RPC call on line 67 already has a try/catch, but the catch block should also handle the case where the function returns an unexpected result. Add defensive null checks.

### 4. Add global error boundary for native WebView
Ensure `ErrorBoundary.tsx` catches rendering crashes gracefully on native instead of showing a white screen or closing the app. Add a recovery button that navigates back to `/auth`.

## Technical Details

**Files to modify:**
- `src/contexts/AppModeContext.tsx` -- `.single()` to `.maybeSingle()` + auto-create profile
- `src/pages/Auth.tsx` -- harden the redirect logic
- `src/components/ErrorBoundary.tsx` -- add native crash recovery UI

**Database migration:**
- Create trigger function `handle_new_user()` that inserts into `profiles` on user signup
- Create trigger `on_auth_user_created` on `auth.users` table

**After approval, rebuild the APK:**
1. Export to GitHub, `git pull`
2. `npm run build`
3. `npx cap sync`
4. `npx cap run android`
