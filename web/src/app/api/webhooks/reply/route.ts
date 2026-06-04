import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // In a real SendGrid/Mailgun webhook, you would parse the "To" or "From" 
    // address and match it against the Lead's email address.
    // For this placeholder, we expect { "email": "lead@example.com" }
    const { email } = payload;

    if (email) {
      // Find the most recent active lead with this email
      const lead = await prisma.lead.findFirst({
        where: { email: email.toLowerCase() },
        orderBy: { createdAt: 'desc' }
      });

      if (lead) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { 
            replied: true, 
            status: "hot" // Auto-qualify as hot
          }
        });

        // Note: The Inngest follow-up sequence checks `lead.replied` automatically
        // and will abort any pending follow-ups if `replied` is true.
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
