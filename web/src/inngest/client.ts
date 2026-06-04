// src/inngest/client.ts
// Inngest client configuration

import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "outreach-ai",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
