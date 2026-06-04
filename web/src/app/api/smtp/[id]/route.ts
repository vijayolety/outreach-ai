// web/src/app/api/smtp/[id]/route.ts
// SMTP account management by ID — DELETE, PATCH

import { getAuthUser } from "@/lib/auth";
import { SmtpService } from "@/modules/smtp/smtp.service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getAuthUser();

        await SmtpService.deleteSmtpAccount(id, user.id);
        return successResponse(null, "SMTP account deleted successfully");
    } catch (error: unknown) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return unauthorizedResponse();
        }
        const msg = error instanceof Error ? error.message : "Failed to delete account";
        return errorResponse(msg, 500);
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getAuthUser();

        // For now, PATCH is a placeholder — full update logic via SmtpUpdateSchema
        const data = await req.json();
        
        // TODO: validate with SmtpUpdateSchema and implement update in SmtpService
        return successResponse({ id, ...data }, "SMTP account updated");
    } catch (error: unknown) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return unauthorizedResponse();
        }
        const msg = error instanceof Error ? error.message : "Failed to update account";
        return errorResponse(msg, 500);
    }
}