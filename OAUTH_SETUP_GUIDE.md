# OAuth Setup Guide: Google & Apple Sign-In

Complete guide for setting up Google and Apple OAuth authentication for both **Web (Next.js)** and **Mobile (Expo)** platforms.

---

## Table of Contents

1. [Overview](#overview)
2. [Apple Sign-In Setup](#-apple-sign-in-setup)
3. [Google Sign-In Setup](#-google-sign-in-setup)
4. [Mobile App Configuration](#-mobile-app-configuration)
5. [Web App Configuration](#-web-app-configuration)
6. [Preventing Conflicts](#-preventing-conflicts)
7. [Testing Checklist](#-testing-checklist)

---

## Overview

### What You'll Set Up

| Provider | Web (OAuth) | Mobile (Native) |
|----------|-------------|-----------------|
| **Google** | Google Cloud Console OAuth | Expo Google Auth |
| **Apple** | Apple Developer Center OAuth | Apple Developer Center Native |

### Prerequisites

- ✅ **Apple Developer Account** ($99/year) - Required for Apple Sign-In
- ✅ **Google Cloud Console Account** (Free) - Required for Google Sign-In
- ✅ **Supabase Project** - Already set up
- ✅ **Domain verified** - getlumbus.com
- ✅ **Mobile app bundle ID** - `com.getlumbus.app` (or your chosen ID)

---

## 🍎 Apple Sign-In Setup

### Step 1: Create App ID

1. **Go to Apple Developer Portal**
   - URL: https://developer.apple.com/account/resources/identifiers/list
   - Click **+** to create new identifier

2. **Select App IDs → Continue**

3. **Fill in App ID details:**
   ```
   Description: Lumbus App
   Bundle ID: com.getlumbus.app
   ```

4. **Enable Capabilities:**
   - ✅ Check **Sign in with Apple**

5. **Click Continue → Register**

---

### Step 2: Create Service ID (for Web OAuth)

1. **Go to Services IDs**
   - URL: https://developer.apple.com/account/resources/identifiers/list/serviceId
   - Click **+** → Select **Services IDs** → Continue

2. **Fill in Service ID details:**
   ```
   Description: Lumbus Web Sign In
   Identifier: com.getlumbus.web
   ```

3. **Enable Sign in with Apple:**
   - ✅ Check **Sign in with Apple**
   - Click **Configure**

4. **Configure Web Authentication:**
   ```
   Primary App ID: com.getlumbus.app (from Step 1)

   Domains and Subdomains:
   - getlumbus.com

   Return URLs:
   - https://qflokprwpxeynodcndbc.supabase.co/auth/v1/callback
   ```

5. **Click Save → Continue → Register**

---

### Step 3: Create Key (for OAuth Secret)

1. **Go to Keys**
   - URL: https://developer.apple.com/account/resources/authkeys/list
   - Click **+**

2. **Create new key:**
   ```
   Key Name: Lumbus Apple Sign In Key
   ```

3. **Enable Sign in with Apple:**
   - ✅ Check **Sign in with Apple**
   - Click **Configure** → Select `com.getlumbus.app`

4. **Register and Download:**
   - Click **Continue** → **Register**
   - **Download the .p8 file** (YOU CAN ONLY DOWNLOAD ONCE!)
   - ⚠️ **Save this file securely** - you cannot re-download it

5. **Note down the Key ID:**
   - It will be shown after download (e.g., `ABC123XYZ`)

---

### Step 4: Generate Secret Key for Supabase

1. **Get your Team ID:**
   - URL: https://developer.apple.com/account/
   - Team ID is shown in top right corner (e.g., `DEF456UVW`)

2. **Generate JWT Secret:**
   - Use Supabase's generator: https://supabase.com/docs/guides/auth/social-login/auth-apple#generate-your-client-secret
   - Or use this command-line tool:

   ```bash
   # Install jwt-cli if needed
   npm install -g jwt-cli

   # Generate secret (replace with your values)
   jwt encode \
     --alg ES256 \
     --exp '+6 months' \
     --iss 'DEF456UVW' \
     --sub 'com.getlumbus.web' \
     --aud 'https://appleid.apple.com' \
     --kid 'ABC123XYZ' \
     --secret @/path/to/AuthKey_ABC123XYZ.p8
   ```

3. **You'll need these values:**
   ```
   Team ID: DEF456UVW (from developer account)
   Service ID: com.getlumbus.web (from Step 2)
   Key ID: ABC123XYZ (from Step 3)
   Private Key: Contents of .p8 file (from Step 3)
   ```

4. **Output:** JWT token (this is your Secret Key)

---

### Step 5: Configure Apple in Supabase Dashboard

1. **Go to Supabase Auth Providers:**
   - URL: https://supabase.com/dashboard/project/qflokprwpxeynodcndbc/auth/providers
   - Find **Apple** provider

2. **Enable and configure:**
   ```
   ☑ Enable Sign in with Apple

   Client IDs: com.getlumbus.app, com.getlumbus.web

   Secret Key (for OAuth): [JWT token from Step 4]

   ☑ Allow users without an email (recommended)

   Callback URL: https://qflokprwpxeynodcndbc.supabase.co/auth/v1/callback
   ```

3. **Click Save**

---

## 🔵 Google Sign-In Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console:**
   - URL: https://console.cloud.google.com/

2. **Create new project:**
   - Click project dropdown → **New Project**
   - Project name: `Lumbus`
   - Click **Create**

---

### Step 2: Enable Google Sign-In API

1. **Go to API Library:**
   - URL: https://console.cloud.google.com/apis/library

2. **Enable required APIs:**
   - Search: **Google+ API** → Click **Enable**
   - Search: **People API** → Click **Enable**

---

### Step 3: Configure OAuth Consent Screen

1. **Go to OAuth consent screen:**
   - URL: https://console.cloud.google.com/apis/credentials/consent

2. **Select User Type:**
   - ⚪ Internal (only for workspace users)
   - ⚫ **External** (for public users) ← Select this
   - Click **Create**

3. **Fill in App Information:**
   ```
   App name: Lumbus
   User support email: support@getlumbus.com
   App logo: (upload your logo - optional)

   Application home page: https://getlumbus.com
   Application privacy policy: https://getlumbus.com/privacy
   Application terms of service: https://getlumbus.com/terms

   Developer contact information:
   - support@getlumbus.com
   ```

4. **Scopes (Step 2):**
   - Click **Add or Remove Scopes**
   - Add these scopes:
     - `email`
     - `profile`
     - `openid`
   - Click **Update** → **Save and Continue**

5. **Test users (Step 3):**
   - Add your email for testing
   - Click **Save and Continue**

6. **Summary (Step 4):**
   - Review and click **Back to Dashboard**

---

### Step 4: Create OAuth 2.0 Client IDs

#### A. Web Application (for Next.js)

1. **Go to Credentials:**
   - URL: https://console.cloud.google.com/apis/credentials

2. **Create credentials:**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**

3. **Select application type:**
   - Application type: **Web application**

4. **Configure Web client:**
   ```
   Name: Lumbus Web

   Authorized JavaScript origins:
   - https://getlumbus.com
   - https://www.getlumbus.com
   - http://localhost:3000 (for development)

   Authorized redirect URIs:
   - https://qflokprwpxeynodcndbc.supabase.co/auth/v1/callback
   - http://localhost:3000/auth/callback (for development)
   ```

5. **Create and save credentials:**
   - Click **Create**
   - **Copy Client ID** (e.g., `123456789-abc.apps.googleusercontent.com`)
   - **Copy Client Secret** (e.g., `GOCSPX-abc123xyz`)
   - Click **OK**

#### B. Android Application (for Expo Android)

1. **Create Android OAuth client:**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Android**

2. **Configure Android client:**
   ```
   Name: Lumbus Android
   Package name: com.getlumbus.app
   ```

3. **Get SHA-1 fingerprint:**

   For development (debug keystore):
   ```bash
   # On macOS/Linux
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # On Windows
   keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   For production (after creating EAS build):
   ```bash
   # Get from EAS
   eas credentials
   ```

4. **Enter SHA-1 and create:**
   - Paste SHA-1 certificate fingerprint
   - Click **Create**
   - **Copy Client ID**

#### C. iOS Application (for Expo iOS)

1. **Create iOS OAuth client:**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **iOS**

2. **Configure iOS client:**
   ```
   Name: Lumbus iOS
   Bundle ID: com.getlumbus.app
   ```

3. **Click Create:**
   - **Copy Client ID**

---

### Step 5: Configure Google in Supabase Dashboard

1. **Go to Supabase Auth Providers:**
   - URL: https://supabase.com/dashboard/project/qflokprwpxeynodcndbc/auth/providers
   - Find **Google** provider

2. **Enable and configure:**
   ```
   ☑ Enable Sign in with Google

   Client IDs (comma-separated):
   [Web Client ID],
   [Android Client ID],
   [iOS Client ID]

   Client Secret (for OAuth):
   [Web Client Secret from Step 4A]

   ☐ Skip nonce checks (leave unchecked for better security)

   ☑ Allow users without an email (optional)

   Callback URL: https://qflokprwpxeynodcndbc.supabase.co/auth/v1/callback
   ```

3. **Click Save**

---

## 📱 Mobile App Configuration

### Step 1: Install Required Packages

```bash
cd mobile-app
npx expo install expo-auth-session expo-crypto expo-web-browser expo-apple-authentication
```

### Step 2: Update Supabase Client

**File:** `mobile-app/lib/supabase.ts`

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Secure storage adapter using device hardware encryption
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // ← Important for mobile!
  },
});
```

### Step 3: Configure app.json

**File:** `mobile-app/app.json`

```json
{
  "expo": {
    "name": "Lumbus",
    "slug": "lumbus",
    "scheme": "lumbus",
    "ios": {
      "bundleIdentifier": "com.getlumbus.app",
      "usesAppleSignIn": true
    },
    "android": {
      "package": "com.getlumbus.app"
    },
    "plugins": [
      "expo-apple-authentication"
    ]
  }
}
```

### Step 4: Implement OAuth Sign-In Components

**Example: Apple Sign-In Component**

```typescript
// mobile-app/components/AppleSignInButton.tsx
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';

export function AppleSignInButton() {
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Sign in with Supabase using Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });

      if (error) throw error;

      // Success! User is signed in
    } catch (error) {
      console.error('Apple sign-in error:', error);
    }
  };

  // Only show on iOS
  if (Platform.OS !== 'ios') return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={5}
      style={{ width: 200, height: 44 }}
      onPress={handleAppleSignIn}
    />
  );
}
```

**Example: Google Sign-In Component**

```typescript
// mobile-app/components/GoogleSignInButton.tsx
import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from '@/lib/supabase';

export function GoogleSignInButton() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      supabase.auth.signInWithIdToken({
        provider: 'google',
        token: id_token,
      });
    }
  }, [response]);

  return (
    <Button
      title="Sign in with Google"
      disabled={!request}
      onPress={() => promptAsync()}
    />
  );
}
```

---

## 🌐 Web App Configuration

### Good News: Already Set Up! ✅

Your current web app configuration in `lib/supabase-client.ts` is already correct for OAuth.

**File:** `lib/supabase-client.ts` (NO CHANGES NEEDED)

```typescript
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // ← Handles OAuth callback automatically
  },
});
```

### OAuth Sign-In Components (Already Implemented)

Your existing components already have the correct implementation:

```typescript
// Example from lib/supabase-client.ts:50-58
signInWithGoogle: async () => {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}
```

---

## 🔒 Preventing Conflicts

### How Multi-Platform OAuth Works

**Apple Sign-In:**
```
Web → Uses Service ID: com.getlumbus.web
iOS → Uses App ID: com.getlumbus.app
```
✅ **No conflict** - Different identifiers for different platforms

**Google Sign-In:**
```
Web → Uses Web OAuth Client ID
Android → Uses Android Client ID
iOS → Uses iOS Client ID
```
✅ **No conflict** - Different client IDs for different platforms

### User Account Linking

**Scenario:** Same user signs in on web and mobile

1. **User signs in on web** with google@example.com
   - Supabase creates user account
   - User ID: `123-abc-456`

2. **User signs in on mobile** with same google@example.com
   - Supabase recognizes email already exists
   - Links to existing account
   - Same User ID: `123-abc-456`

✅ **Automatic account linking** - User has one account across all platforms

### Important Settings in Supabase

Ensure these are configured in Supabase Dashboard → Authentication → Settings:

```
☑ Enable email confirmations (optional, can disable for OAuth)
☑ Enable auto-confirm email for OAuth providers
☑ Secure email change (recommended)
```

---

## ✅ Testing Checklist

### Before Going Live

#### Apple Sign-In
- [ ] App ID created with Sign in with Apple capability
- [ ] Service ID created and configured with correct domain
- [ ] Key (.p8 file) downloaded and stored securely
- [ ] Secret key (JWT) generated successfully
- [ ] Supabase configured with both client IDs
- [ ] Web OAuth flow tested (redirects to Apple → back to app)
- [ ] Mobile native flow tested (iOS only)
- [ ] User account created successfully
- [ ] Email address received (or gracefully handled if not provided)

#### Google Sign-In
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] Web OAuth client created
- [ ] Android OAuth client created (with correct SHA-1)
- [ ] iOS OAuth client created
- [ ] Supabase configured with all client IDs
- [ ] Web OAuth flow tested (redirects to Google → back to app)
- [ ] Mobile OAuth flow tested (both Android and iOS)
- [ ] User account created successfully
- [ ] Profile picture and name retrieved correctly

#### Cross-Platform Testing
- [ ] Sign in on web, verify session persists
- [ ] Sign in on mobile, verify session persists
- [ ] Sign in on web, then mobile with same email → accounts linked
- [ ] Sign out on web, verify session cleared
- [ ] Sign out on mobile, verify session cleared
- [ ] Test with users who have no email address (Apple hide email)
- [ ] Test with users who cancel OAuth flow

---

## 📝 Environment Variables

### Web App (.env.local)
```bash
# Already configured - no changes needed
NEXT_PUBLIC_SUPABASE_URL=https://qflokprwpxeynodcndbc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Mobile App (.env)
```bash
# Already configured - no changes needed
EXPO_PUBLIC_SUPABASE_URL=https://qflokprwpxeynodcndbc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🆘 Troubleshooting

### Apple Sign-In Issues

**Error: "Invalid client"**
- Check Service ID matches exactly: `com.getlumbus.web`
- Verify domain is added: `getlumbus.com` (no www)
- Ensure return URL is exact: `https://qflokprwpxeynodcndbc.supabase.co/auth/v1/callback`

**Error: "Returned aud (com.example.app) does not match configured client ID"**
- This happens when Supabase expects the Service ID (`.web`) but receives the App Bundle ID (`.app`).
- **Fix:** Add your iOS Bundle ID (e.g., `com.getlumbus.app`) to the "Client IDs" list in Supabase Apple Provider settings.
- You can add multiple IDs separated by commas in Supabase.

**Error: "Invalid JWT"**
- Secret key expires every 6 months - regenerate it
- Check Team ID, Service ID, and Key ID are correct
- Verify .p8 file contents are properly formatted

**Mobile: Apple button doesn't show**
- Only available on iOS devices (not Android or web)
- Check `expo-apple-authentication` is installed
- Verify `usesAppleSignIn: true` in app.json

### Google Sign-In Issues

**Error: "redirect_uri_mismatch"**
- Check redirect URI exactly matches: `https://qflokprwpxeynodcndbc.supabase.co/auth/v1/callback`
- Ensure no trailing slashes
- Verify authorized domains include your domain

**Error: "OAuth consent screen not configured"**
- Complete OAuth consent screen setup
- Add your email as a test user if in testing mode
- Publish app if ready for production

**Mobile: "DEVELOPER_ERROR"**
- SHA-1 fingerprint mismatch
- Check package name matches: `com.getlumbus.app`
- Ensure correct OAuth client ID for platform

### Session Issues

**Session not persisting**
- Web: Check browser cookies are enabled
- Mobile: Verify SecureStore permissions granted
- Check `persistSession: true` in Supabase config

**User not redirected after OAuth**
- Web: Ensure `detectSessionInUrl: true`
- Mobile: Ensure `detectSessionInUrl: false`
- Check app scheme configured: `lumbus://`

---

## 📚 Resources

### Apple Developer
- [Sign in with Apple Overview](https://developer.apple.com/sign-in-with-apple/)
- [Configuring Your Webpage](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/configuring_your_webpage_for_sign_in_with_apple)
- [Generate JWT for Apple](https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens)

### Google Cloud
- [OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [OAuth Consent Screen](https://support.google.com/cloud/answer/10311615)
- [Redirect URI Best Practices](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation)

### Supabase
- [Social Login Overview](https://supabase.com/docs/guides/auth/social-login)
- [Sign in with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Sign in with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

### Expo
- [Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Google Sign-In](https://docs.expo.dev/guides/google-authentication/)
- [Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)

---

## 🎯 Quick Reference

### Apple Credentials Needed
```
✓ Team ID: [from Apple Developer account]
✓ App ID: com.getlumbus.app
✓ Service ID: com.getlumbus.web
✓ Key ID: [from .p8 key]
✓ Private Key: [.p8 file contents]
✓ Secret Key: [Generated JWT token]
```

### Google Credentials Needed
```
✓ Web Client ID: [from Google Cloud Console]
✓ Web Client Secret: [from Google Cloud Console]
✓ Android Client ID: [from Google Cloud Console]
✓ iOS Client ID: [from Google Cloud Console]
```

### Supabase Configuration URLs
```
✓ Auth Providers: https://supabase.com/dashboard/project/qflokprwpxeynodcndbc/auth/providers
✓ Auth Settings: https://supabase.com/dashboard/project/qflokprwpxeynodcndbc/auth/users
✓ Callback URL: https://qflokprwpxeynodcndbc.supabase.co/auth/v1/callback
```

---

**Last Updated:** 2025-10-21
**Status:** Ready to implement when developer accounts are available
**Security Score Impact:** No change (OAuth adds convenience, existing auth is already secure)
