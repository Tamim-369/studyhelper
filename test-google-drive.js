#!/usr/bin/env node

/**
 * Test script for Google Drive integration
 * This script tests the API endpoints we created
 */

const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('🧪 Testing Google Drive Integration Endpoints\n');

  // Test 1: Check if upload endpoint exists
  console.log('1. Testing upload endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/upload-to-drive`, {
      method: 'POST',
      body: new FormData() // Empty form data to test validation
    });
    
    if (response.status === 401) {
      console.log('✅ Upload endpoint exists and requires authentication');
    } else {
      console.log(`⚠️  Upload endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Upload endpoint test failed:', error.message);
  }

  // Test 2: Check if my-drive-books endpoint exists
  console.log('\n2. Testing my-drive-books endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/books/my-drive-books`);
    
    if (response.status === 401) {
      console.log('✅ My-drive-books endpoint exists and requires authentication');
    } else {
      console.log(`⚠️  My-drive-books endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ My-drive-books endpoint test failed:', error.message);
  }

  // Test 3: Check if drive-pdf endpoint exists
  console.log('\n3. Testing drive-pdf endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/books/drive-pdf/test-id`);
    
    if (response.status === 401) {
      console.log('✅ Drive-pdf endpoint exists and requires authentication');
    } else {
      console.log(`⚠️  Drive-pdf endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Drive-pdf endpoint test failed:', error.message);
  }

  // Test 4: Check if regular books endpoint works
  console.log('\n4. Testing books endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/books`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Books endpoint works correctly');
      console.log(`   Found ${data.data.books.length} books in database`);
    } else {
      console.log('❌ Books endpoint failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Books endpoint test failed:', error.message);
  }

  console.log('\n🏁 Test completed!');
  console.log('\nNext steps:');
  console.log('1. Open http://localhost:3000/upload in your browser');
  console.log('2. Sign in with Google');
  console.log('3. Upload a PDF file');
  console.log('4. Verify it appears in your books list');
  console.log('5. Try opening the PDF in the reader');
}

// Run the tests
testEndpoints().catch(console.error);
