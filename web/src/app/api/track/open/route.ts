import { NextRequest, NextResponse } from "next/server";
import { TrackingService } from "@/modules/tracking/tracking.service";
import { logger } from "@/lib/logger";

/**
 * Global Open Tracking API
 * Supports both dynamic path segments and query parameters for maximum robustness.
 * GET /api/track/open/[leadId] OR /api/track/open?leadId=[leadId]
 */

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  request: NextRequest,
  { params }: { params?: { leadId?: string } }
) {
  // 1. Resolve leadId from either dynamic segment or query param
  const url = new URL(request.url);
  const leadId = params?.leadId || url.searchParams.get("leadId") || url.searchParams.get("id");

  if (leadId) {
    // 2. Fire and forget tracking record to avoid delaying pixel response
    TrackingService.recordOpen(leadId).catch(err => {
      logger.error("Tracking background failure", "TrackOpenRoute", { leadId, error: err.message });
    });
    
    // Log for visibility during debug
    console.log(`[Tracking] Inbound open pixel hit for lead: ${leadId}`);
  } else {
    logger.warn("Tracking hit without ID", "TrackOpenRoute", { url: request.url });
  }

  // 3. Always return the invisible pixel immediately
  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
