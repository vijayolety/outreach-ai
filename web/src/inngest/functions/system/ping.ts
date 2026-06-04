// src/inngest/functions/system/ping.ts
// Simple health check function for Inngest connectivity testing

import { inngest } from "../../client";

export const ping = inngest.createFunction(
  { id: "ping", triggers: [{ event: "test/ping" }] },
  async () => {
    return { message: "pong", timestamp: new Date().toISOString() };
  }
);
