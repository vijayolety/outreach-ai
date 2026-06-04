import { ZodError } from "zod";

import { AuthService } from "@/modules/auth/auth.service";

import { RegisterSchema } from "@/schemas/auth.schema";

import {
    successResponse,
    errorResponse,
} from "@/lib/api-response";

import { logger } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const validatedData =
            RegisterSchema.parse(body);

        const user =
            await AuthService.registerUser(
                validatedData
            );

        return successResponse(
            {
                userId: user.id,
            },
            "User created successfully",
            201
        );
    } catch (error) {
        logger.error(
            "Register Error:",
            error instanceof Error ? error : new Error(String(error))
        );

        if (error instanceof ZodError) {
            return errorResponse(
                "Validation failed",
                400,
                error.flatten()
            );
        }

        if (error instanceof Error) {
            return errorResponse(
                error.message,
                400
            );
        }

        return errorResponse(
            "Internal server error",
            500
        );
    }
}