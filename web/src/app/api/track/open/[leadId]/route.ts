import { NextRequest, NextResponse } from "next/server";
import { TrackingService } from "@/modules/tracking/tracking.service";
import { logger } from "@/lib/logger";

/**
 * Dynamic Open Tracking API
 * Handles signals from /api/track/open/[leadId]
 */

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;

  if (leadId) {
    // Record open in background
    TrackingService.recordOpen(leadId).then(success => {
      if (success) {
        console.log(`[Tracking] Lead ${leadId} opened the email`);
      }
    }).catch(err => {
      logger.error("Dynamic tracking failure", "TrackOpenDynamic", { leadId, error: err.message });
    });
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
