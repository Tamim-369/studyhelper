#!/usr/bin/env node

/**
 * OAuth Configuration Verification Script
 * Run this to verify your Google OAuth setup
 */

console.log('🔍 Verifying Google OAuth Configuration...\n');

// Check environment variables
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

console.log('📋 Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔧 Required Google Cloud Console Settings:');
console.log('1. Go to: https://console.cloud.google.com/');
console.log('2. Navigate to: APIs & Services > Credentials');
console.log('3. Click on your OAuth 2.0 Client ID');
console.log('4. Add these Authorized redirect URIs:');
console.log('   - https://studyhelper369.vercel.app/api/auth/callback/google');
console.log('   - http://localhost:3000/api/auth/callback/google (for development)');
console.log('5. Add these Authorized JavaScript origins:');
console.log('   - https://studyhelper369.vercel.app');
console.log('   - http://localhost:3000 (for development)');

console.log('\n🚀 Vercel Environment Variables:');
console.log('Make sure these are set in your Vercel dashboard:');
requiredEnvVars.forEach(varName => {
  console.log(`- ${varName}`);
});

console.log('\n🔗 Test URLs:');
console.log('- Production: https://studyhelper369.vercel.app/upload');
console.log('- Development: http://localhost:3000/upload');

console.log('\n✨ After making these changes:');
console.log('1. Redeploy your Vercel app');
console.log('2. Test the Google sign-in flow');
console.log('3. Upload a PDF to Google Drive');
