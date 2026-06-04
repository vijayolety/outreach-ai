// src/app/api/smtp/route.ts
// SMTP account management API — GET, POST, DELETE

import { getAuthUser } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  notFoundResponse,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { SmtpService } from "@/modules/smtp/smtp.service";
import { SmtpSchema } from "@/schemas/smtp.schema";
import { ZodError } from "zod";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const user = await getAuthUser();
    const accounts = await SmtpService.getSmtpAccountsByUser();
    return successResponse(accounts);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    logger.error("Get SMTP accounts failed", error instanceof Error ? error : undefined);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    const body = await req.json();
    const validatedData = SmtpSchema.parse(body);

    const account = await SmtpService.createSmtpAccount(user.id, validatedData);

    return successResponse(account, "SMTP account created successfully", 201);
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
    logger.error("Create SMTP account failed", "SmtpRoute");
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("id");

    if (!accountId) {
      return errorResponse("Account ID is required", 400);
    }

    await SmtpService.deleteSmtpAccount(accountId, user.id);
    return successResponse(null, "SMTP account deleted successfully");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    logger.error("Delete SMTP account failed", "SmtpRoute");
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("id");

    if (!accountId) {
      return errorResponse("Account ID is required", 400);
    }

    const isActive = await SmtpService.toggleSmtpStatus(accountId, user.id);
    return successResponse({ isActive }, `SMTP account ${isActive ? 'enabled' : 'disabled'} successfully`);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    logger.error("Toggle SMTP status failed", "SmtpRoute");
    return errorResponse("Internal server error", 500);
  }
}