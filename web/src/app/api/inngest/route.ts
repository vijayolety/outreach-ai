// src/app/api/inngest/route.ts
// Inngest event handler — serves all workflow functions

export const dynamic = "force-dynamic";

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  ping,
  generateDraftsBatch,
  sendEmailSequence,
  scheduleFollowUps,
  checkInboxForReplies,
  smtpHealthCheck,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ping,
    generateDraftsBatch,
    sendEmailSequence,
    scheduleFollowUps,
    checkInboxForReplies,
    smtpHealthCheck,
  ],
});
