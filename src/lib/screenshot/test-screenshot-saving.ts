/**
 * Test utility to verify screenshot saving functionality
 */

export interface ScreenshotTestResult {
  success: boolean;
  filename?: string;
  path?: string;
  url?: string;
  size?: number;
  error?: string;
}

/**
 * Test screenshot saving by creating a simple test image
 */
export async function testScreenshotSaving(
  bookId: string = "test-book"
): Promise<ScreenshotTestResult> {
  try {
    console.log("🧪 Testing screenshot saving functionality...");

    // Create a simple test canvas
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext("2d")!;

    // Draw a test pattern
    ctx.fillStyle = "#f0f9ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add border
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Add test text
    ctx.fillStyle = "#1e40af";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Screenshot Test", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "12px Arial";
    ctx.fillText(
      `Generated: ${new Date().toLocaleTimeString()}`,
      canvas.width / 2,
      canvas.height / 2 + 10
    );
    ctx.fillText(
      `Book ID: ${bookId}`,
      canvas.width / 2,
      canvas.height / 2 + 30
    );

    // Convert to base64
    const screenshot = canvas.toDataURL("image/png");
    console.log(
      "📸 Test screenshot created, size:",
      screenshot.length,
      "characters"
    );

    // Send to server
    const response = await fetch("/api/screenshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        screenshot,
        bookId,
        pageNumber: 1,
        selectionId: `test_${Date.now()}`,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Screenshot test successful:", data.data);

      return {
        success: true,
        filename: data.data.filename,
        path: data.data.path,
        url: data.data.url,
        size: data.data.size,
      };
    } else {
      const errorText = await response.text();
      console.error("❌ Screenshot test failed:", response.status, errorText);

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }
  } catch (error: any) {
    console.error("❌ Screenshot test error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List all screenshots in the uploads/screenshots directory
 */
export async function listSavedScreenshots(): Promise<string[]> {
  try {
    // This would need to be implemented as an API endpoint
    // For now, we'll just log instructions
    console.log("📁 To view saved screenshots, check the following directory:");
    console.log("   uploads/screenshots/");
    console.log("");
    console.log("💡 Screenshots are saved with the format:");
    console.log("   {bookId}_page{pageNumber}_{date}_{selectionId}.png");
    console.log("");
    console.log("🔗 You can access them via:");
    console.log("   http://localhost:3000/api/files/screenshots/{filename}");

    return [];
  } catch (error) {
    console.error("Error listing screenshots:", error);
    return [];
  }
}

/**
 * Run a comprehensive screenshot test
 */
export async function runScreenshotTests(): Promise<void> {
  console.log("🚀 Running comprehensive screenshot tests...");
  console.log("");

  // Test 1: Basic screenshot saving
  console.log("Test 1: Basic screenshot saving");
  const test1 = await testScreenshotSaving("test-book-1");
  console.log("Result:", test1.success ? "✅ PASS" : "❌ FAIL", test1);
  console.log("");

  // Test 2: Different book ID
  console.log("Test 2: Different book ID");
  const test2 = await testScreenshotSaving("test-book-2");
  console.log("Result:", test2.success ? "✅ PASS" : "❌ FAIL", test2);
  console.log("");

  // Test 3: List screenshots
  console.log("Test 3: List saved screenshots");
  await listSavedScreenshots();
  console.log("");

  console.log("🏁 Screenshot tests completed!");
  console.log("");
  console.log("📋 Summary:");
  console.log(`   Test 1 (Basic): ${test1.success ? "✅ PASS" : "❌ FAIL"}`);
  console.log(
    `   Test 2 (Different ID): ${test2.success ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log("");

  if (test1.success || test2.success) {
    console.log("🎉 Screenshot saving is working!");
    console.log("📁 Check uploads/screenshots/ folder for saved files");
  } else {
    console.log("⚠️  Screenshot saving needs attention");
    console.log("🔧 Check API endpoints and file permissions");
  }
}
