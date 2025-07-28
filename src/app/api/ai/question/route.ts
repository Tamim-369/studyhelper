import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";

export async function POST(request: NextRequest) {
  try {
    const { question, context, bookId, pageNumber } = await request.json();

    console.log("Follow-up question received:", {
      question: question?.substring(0, 100),
      contextLength: context?.length,
      bookId,
      pageNumber,
    });

    // Validate input
    if (!question || !context) {
      return NextResponse.json(
        { error: "Missing question or context" },
        { status: 400 }
      );
    }

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY not configured");
      return NextResponse.json({
        success: true,
        answer: `I'd be happy to answer your question: "${question}"\n\nHowever, the AI service isn't fully configured right now. Based on the content you selected:\n\n"${context.substring(
          0,
          200
        )}..."\n\nI can see this is from page ${pageNumber} of your document. To get a proper AI response, please ensure the GROQ_API_KEY is configured in your environment variables.\n\nIn the meantime, feel free to ask more specific questions about the content, and I'll do my best to provide helpful guidance!`,
      });
    }

    console.log("Sending follow-up question to AI...");

    // Generate AI response for the follow-up question
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant explaining content from a PDF document. The user has selected some content and is asking a follow-up question about it.

**Guidelines:**
- Provide clear, helpful explanations in **well-formatted markdown**
- Use proper markdown formatting:
  - Use **bold** for emphasis
  - Use *italics* for definitions
  - Use \`code\` for technical terms or formulas
  - Use bullet points and numbered lists
  - Use > for important quotes or key concepts
- Structure your response with clear sections if needed
- Use the context to give accurate answers
- If the question is unclear, ask for clarification
- Keep responses concise but informative
- Use examples when helpful
- Be encouraging and supportive

**Format your response as clean, readable markdown.**`,
        },
        {
          role: "user",
          content: `I'm reading a PDF document and selected this content from page ${pageNumber}:

"${context}"

My question about this content is: ${question}

Please provide a helpful explanation or answer to my question.`,
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const answer = chatCompletion.choices[0]?.message?.content || "";

    if (answer.trim().length > 0) {
      console.log("✅ Follow-up answer generated successfully");
      console.log("📝 Answer length:", answer.length);

      return NextResponse.json({
        success: true,
        answer: answer.trim(),
        question,
        pageNumber,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log("⚠️ Empty response from AI");
      return NextResponse.json({
        success: true,
        answer: `I received your question: "${question}"\n\nBased on the content you selected, I can see this is an interesting topic. However, I'm having trouble generating a detailed response right now.\n\nCould you try:\n• Rephrasing your question more specifically\n• Asking about a particular aspect of the content\n• Providing more context about what you'd like to understand\n\nI'm here to help explain the content in whatever way would be most useful for you!`,
      });
    }
  } catch (error: any) {
    console.error("Error processing follow-up question:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process question",
        answer: `I encountered an error while processing your question: ${error.message}\n\nThis could be due to:\n• API service temporarily unavailable\n• Network connectivity issues\n• Question processing limitations\n\nPlease try:\n• Asking your question again\n• Rephrasing it differently\n• Checking your internet connection\n\nI'm still here to help once the issue is resolved!`,
      },
      { status: 500 }
    );
  }
}
