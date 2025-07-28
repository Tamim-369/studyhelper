import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    console.log("OCR extraction request received");

    // Validate input
    if (!image) {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }

    // Extract text using OCR
    const extractedText = await performOCR(image);

    return NextResponse.json({
      extractedText,
      success: true,
    });
  } catch (error: any) {
    console.error("OCR extraction error:", error);
    return NextResponse.json(
      { error: "OCR extraction failed", details: error.message },
      { status: 500 }
    );
  }
}

async function performOCR(base64Image: string): Promise<string> {
  try {
    console.log("🤖 Starting AI vision analysis with Groq...");

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log("📸 Sending image to AI for analysis...");

    // Use Groq's vision model to analyze the image directly
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that analyzes images and provides detailed explanations. When you see an image, please:

1. **Extract and analyze ALL visible content** - text, formulas, diagrams, charts, etc.
2. **Provide a comprehensive explanation** in well-formatted markdown
3. **Use proper markdown formatting**:
   - Use # ## ### for headings
   - Use **bold** for emphasis
   - Use *italics* for definitions
   - Use \`code\` for formulas or technical terms
   - Use bullet points and numbered lists
   - Use > for important quotes or key concepts
4. **Structure your response clearly** with sections like:
   - ## Content Summary
   - ## Key Concepts  
   - ## Detailed Explanation
   - ## Important Points
5. **For mathematical content**: Explain formulas step by step
6. **For diagrams/charts**: Describe what they show and their significance
7. **Make it educational and helpful** - explain concepts, provide context, and help the user understand

Format your response as clean, readable markdown that will be displayed in a modal.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all the text from this image. Include everything you can see - text, numbers, formulas, labels, etc. Maintain the original structure and formatting as much as possible.",
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct", // Llama 4 Scout vision model
      temperature: 0.1, // Low temperature for accurate text extraction
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    const extractedText = chatCompletion.choices[0]?.message?.content || "";

    if (extractedText.trim().length > 0) {
      console.log("✅ AI vision analysis completed!");
      console.log("📝 Extracted text length:", extractedText.length);
      console.log("👀 Text preview:", extractedText.substring(0, 200) + "...");

      return extractedText.trim();
    } else {
      console.log("⚠️ No text extracted from image");
      return "I can see the image, but I'm having trouble extracting readable text from it. This could be because:\n\n• The image contains mostly graphics, diagrams, or images without text\n• The text is too small, blurry, or low contrast\n• The image quality makes text recognition difficult\n\nCould you:\n1. **Describe what you see** in the selected area\n2. **Try selecting a larger area** with clearer text\n3. **Copy-paste any text** if you can read it manually\n\nI'm ready to help explain the content once I understand what you're looking at!";
    }
  } catch (error: any) {
    console.error("❌ AI vision analysis failed:", error);

    // Check if it's an API key issue
    if (
      error.message?.includes("API key") ||
      error.message?.includes("authentication")
    ) {
      return "AI vision analysis is not available (API key not configured). \n\nTo help you with the selected content:\n1. **Describe what you see** in the selected area\n2. **Copy-paste any text** from the selection\n3. **Ask specific questions** about the content\n\nFor example: 'Explain this diagram showing...' or 'What does this formula mean: [paste formula]'";
    }

    return `AI vision analysis encountered an error: ${error.message}\n\n**What you can do:**\n• Describe what you see in the selected area\n• Copy-paste any readable text\n• Try selecting a different area\n• Ask specific questions about the content\n\nI'm ready to help explain once I understand what you're looking at!`;
  }
}
