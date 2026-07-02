// Comprehensive code verification testing - COMMENTED OUT FOR PRODUCTION
/*
import { authService } from '@/services/authService';
import axios from 'axios';

export const testCodeVerificationFlow = async (email: string) => {
  console.log('=== COMPREHENSIVE CODE VERIFICATION TEST ===');
  console.log('Testing email:', email);
  
  const results = {
    validCode: null as any,
    invalidCode: null as any,
    expiredCode: null as any,
    emptyCode: null as any
  };
  
  // Test 1: Valid code (assuming 123456 might be a test code)
  console.log('\n--- Test 1: Testing with code "123456" ---');
  try {
    const result = await authService.verifyPasswordResetCode(email, '123456');
    console.log('✅ Code "123456" PASSED verification:', result);
    results.validCode = { success: true, data: result };
  } catch (error: any) {
    console.log('❌ Code "123456" FAILED verification:', error.message);
    results.validCode = { success: false, error: error.message };
  }
  
  // Test 2: Invalid code
  console.log('\n--- Test 2: Testing with invalid code "999999" ---');
  try {
    const result = await authService.verifyPasswordResetCode(email, '999999');
    console.log('⚠️ Invalid code "999999" UNEXPECTEDLY PASSED:', result);
    results.invalidCode = { success: true, data: result, warning: 'Invalid code should have failed!' };
  } catch (error: any) {
    console.log('✅ Invalid code "999999" correctly FAILED:', error.message);
    results.invalidCode = { success: false, error: error.message };
  }
  
  // Test 3: Another invalid code
  console.log('\n--- Test 3: Testing with invalid code "000000" ---');
  try {
    const result = await authService.verifyPasswordResetCode(email, '000000');
    console.log('⚠️ Invalid code "000000" UNEXPECTEDLY PASSED:', result);
    results.expiredCode = { success: true, data: result, warning: 'Invalid code should have failed!' };
  } catch (error: any) {
    console.log('✅ Invalid code "000000" correctly FAILED:', error.message);
    results.expiredCode = { success: false, error: error.message };
  }
  
  // Test 4: Empty code
  console.log('\n--- Test 4: Testing with empty code ---');
  try {
    const result = await authService.verifyPasswordResetCode(email, '');
    console.log('⚠️ Empty code UNEXPECTEDLY PASSED:', result);
    results.emptyCode = { success: true, data: result, warning: 'Empty code should have failed!' };
  } catch (error: any) {
    console.log('✅ Empty code correctly FAILED:', error.message);
    results.emptyCode = { success: false, error: error.message };
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log('Valid code (123456):', results.validCode?.success ? '✅ PASSED' : '❌ FAILED');
  console.log('Invalid code (999999):', results.invalidCode?.success ? '⚠️ PASSED (SHOULD FAIL)' : '✅ FAILED (CORRECT)');
  console.log('Invalid code (000000):', results.expiredCode?.success ? '⚠️ PASSED (SHOULD FAIL)' : '✅ FAILED (CORRECT)');
  console.log('Empty code:', results.emptyCode?.success ? '⚠️ PASSED (SHOULD FAIL)' : '✅ FAILED (CORRECT)');
  
  // Check if there's a problem
  const hasIssue = results.invalidCode?.success || results.expiredCode?.success || results.emptyCode?.success;
  if (hasIssue) {
    console.log('\n🚨 ISSUE DETECTED: Invalid codes are passing verification!');
    console.log('This suggests the API is not properly validating codes.');
  } else {
    console.log('\n✅ Code verification appears to be working correctly.');
  }
  
  return results;
};

// Direct API test to see raw responses
export const testRawCodeVerificationAPI = async (email: string, code: string) => {
  console.log('=== RAW API TEST ===');
  console.log('Email:', email);
  console.log('Code:', code);
  
  const endpoint = 'https://kiwamitestcloud.com/dashboardapis/api/resetpwdcodeconfirmation';
  
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers.Authorization = token;
  }
  
  const payload = {
    email: email.trim().toLowerCase(),
    code: code.trim()
  };
  
  console.log('Request details:');
  console.log('- URL:', endpoint);
  console.log('- Headers:', headers);
  console.log('- Payload:', payload);
  
  try {
    const response = await axios.post(endpoint, payload, {
      headers,
      timeout: 15000,
      validateStatus: () => true // Accept all status codes
    });
    
    console.log('Raw API Response:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', response.headers);
    console.log('- Data:', JSON.stringify(response.data, null, 2));
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: Object.fromEntries(Object.entries(response.headers))
    };
    
  } catch (error: any) {
    console.log('Raw API Error:');
    console.log('- Message:', error.message);
    console.log('- Code:', error.code);
    console.log('- Response Status:', error.response?.status);
    console.log('- Response Data:', error.response?.data);
    
    return {
      error: true,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// Make functions available globally - COMMENTED OUT FOR PRODUCTION
if (typeof window !== 'undefined') {
  (window as any).testCodeVerificationFlow = testCodeVerificationFlow;
  (window as any).testRawCodeVerificationAPI = testRawCodeVerificationAPI;
}
*/