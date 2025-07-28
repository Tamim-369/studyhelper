import Groq from "groq-sdk";
import { GroqMessage, GroqResponse } from "@/types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export class GroqAI {
  private static instance: GroqAI;

  private constructor() {}

  public static getInstance(): GroqAI {
    if (!GroqAI.instance) {
      GroqAI.instance = new GroqAI();
    }
    return GroqAI.instance;
  }

  /**
   * Generate an explanation for highlighted text using context
   */
  async generateExplanation(
    highlightedText: string,
    contextText: string,
    bookTitle: string,
    bookAuthor: string
  ): Promise<string> {
    const messages: GroqMessage[] = [
      {
        role: "system",
        content: `You are an expert academic tutor helping students understand complex texts. 
        You will be given a highlighted section from a book and its surrounding context. 
        Provide a clear, comprehensive explanation that:
        
        1. Explains the highlighted text in simple terms
        2. Provides relevant background information
        3. Connects it to the broader context of the book
        4. Uses examples or analogies when helpful
        5. Keeps the explanation engaging and educational
        
        Book: "${bookTitle}" by ${bookAuthor}
        
        Be concise but thorough, aiming for 2-4 paragraphs.`,
      },
      {
        role: "user",
        content: `Please explain this highlighted section:

HIGHLIGHTED TEXT:
"${highlightedText}"

CONTEXT (surrounding pages):
${contextText}

Please provide a clear explanation of the highlighted section, considering the context provided.`,
      },
    ];

    try {
      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.1-8b-instant", // Updated to supported model
        temperature: 0.7,
        max_tokens: 1000,
      });

      return (
        completion.choices[0]?.message?.content ||
        "Unable to generate explanation."
      );
    } catch (error) {
      console.error("Error generating explanation:", error);
      throw new Error("Failed to generate explanation. Please try again.");
    }
  }

  /**
   * Answer follow-up questions about the highlighted content
   */
  async answerQuestion(
    question: string,
    originalExplanation: string,
    highlightedText: string,
    contextText: string,
    bookTitle: string,
    bookAuthor: string,
    conversationHistory: Array<{ question: string; answer: string }> = []
  ): Promise<string> {
    const messages: GroqMessage[] = [
      {
        role: "system",
        content: `You are an expert academic tutor helping students understand complex texts. 
        You have previously provided an explanation for a highlighted section, and now the student has a follow-up question.
        
        Book: "${bookTitle}" by ${bookAuthor}
        
        Provide clear, helpful answers that:
        1. Directly address the student's question
        2. Reference the original highlighted text and explanation when relevant
        3. Use the context to provide comprehensive answers
        4. Encourage deeper thinking and learning
        5. Keep responses focused and educational`,
      },
      {
        role: "user",
        content: `ORIGINAL HIGHLIGHTED TEXT:
"${highlightedText}"

CONTEXT:
${contextText}

PREVIOUS EXPLANATION:
${originalExplanation}

${
  conversationHistory.length > 0
    ? `
CONVERSATION HISTORY:
${conversationHistory
  .map(
    (item, index) => `
Q${index + 1}: ${item.question}
A${index + 1}: ${item.answer}
`
  )
  .join("")}
`
    : ""
}

STUDENT'S QUESTION:
${question}

Please answer the student's question clearly and helpfully.`,
      },
    ];

    try {
      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 800,
      });

      return (
        completion.choices[0]?.message?.content ||
        "Unable to answer the question."
      );
    } catch (error) {
      console.error("Error answering question:", error);
      throw new Error("Failed to answer question. Please try again.");
    }
  }

  /**
   * Generate a summary of multiple highlights from a book
   */
  async generateHighlightsSummary(
    highlights: Array<{ text: string; pageNumber: number; note?: string }>,
    bookTitle: string,
    bookAuthor: string
  ): Promise<string> {
    const messages: GroqMessage[] = [
      {
        role: "system",
        content: `You are an expert academic tutor. Create a comprehensive summary of the student's highlights from a book.
        
        Book: "${bookTitle}" by ${bookAuthor}
        
        Your summary should:
        1. Identify key themes and concepts from the highlights
        2. Show connections between different highlighted sections
        3. Provide insights into the student's learning focus
        4. Suggest areas for further study or reflection
        5. Be well-organized and educational`,
      },
      {
        role: "user",
        content: `Please create a summary of these highlights:

${highlights
  .map(
    (highlight, index) => `
HIGHLIGHT ${index + 1} (Page ${highlight.pageNumber}):
"${highlight.text}"
${highlight.note ? `Student Note: ${highlight.note}` : ""}
`
  )
  .join("")}

Please provide a comprehensive summary that helps the student understand the key concepts and connections.`,
      },
    ];

    try {
      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 1200,
      });

      return (
        completion.choices[0]?.message?.content || "Unable to generate summary."
      );
    } catch (error) {
      console.error("Error generating summary:", error);
      throw new Error("Failed to generate summary. Please try again.");
    }
  }
}

export const groqAI = GroqAI.getInstance();
