import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) {
      return NextResponse.json({ success: false, text: "" }, { status: 401 });
    }

    const { type, plan } = await request.json();
    if (!plan) return NextResponse.json({ text: "" });

    let prompt = "";
    if (type === "intro") {
      prompt = `You are a hype-man fitness coach. Look at the following workout plan and give a short 1-sentence "Theme of the day" followed by a random cheeky one-liner citing a hilarious, extreme, or dramatic benefit of strengthening that specific body part! Just raw text natively, no markdown blocks. Plan: ${JSON.stringify(plan)}`;
    } else if (type === "summary") {
      const hourStr = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hour12: false });
      const hour = parseInt(hourStr, 10);
      let timeInstruction = "say something catchy about resting well since it's the evening";
      if (hour >= 5 && hour < 12) {
        timeInstruction = "say something catchy about eating well and fueling up since it's the morning";
      } else if (hour >= 12 && hour < 17) {
        timeInstruction = "say something catchy about carrying this energy through the rest of the day";
      }
      
      prompt = `You are a hype fitness coach. The user just finished their workout. Give a VERY brief 1-2 sentence compliment highlighting any PRs or heavy lifts from the data if any exist. Then, ${timeInstruction}. Keep it extremely short, fast, and punchy. No markdown. Plan: ${JSON.stringify(plan)}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ success: true, text: response.text });
  } catch (error) {
    return NextResponse.json({ success: false, text: "" });
  }
}
