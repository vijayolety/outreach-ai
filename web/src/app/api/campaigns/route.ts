// src/app/api/campaigns/route.ts
// Campaign management API — GET, POST

import { getAuthUser } from "@/lib/auth";
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from "@/lib/api-response";
import { CampaignService } from "@/modules/campaign/campaign.service";
import { CampaignCreateSchema } from "@/schemas/campaign.schema";
import { logger } from "@/lib/logger";
import { ZodError } from "zod";

export async function GET() {
  try {
    const user = await getAuthUser();
    const campaigns = await CampaignService.getListForUser(user.id);
    return successResponse(campaigns);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    logger.error("Get campaigns failed", error instanceof Error ? error : undefined);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    const body = await req.json();
    const validated = CampaignCreateSchema.parse(body);

    const leads = JSON.parse(validated.leadsData);
    const campaignId = await CampaignService.createFromUpload(
      user.id,
      validated.campaignName,
      leads
    );

    return successResponse({ campaignId }, "Campaign created successfully", 201);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    logger.error("Create campaign failed", "CampaignRoute");
    return errorResponse("Internal server error", 500);
  }
}
