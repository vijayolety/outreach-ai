// src/modules/lead/validateLeads.ts
// Lead validation with fuzzy header mapping and email deduplication

import type { LeadInput, LeadValidationResult } from "@/types";
import { leadInputSchema } from "./leadSchema";

type ParsedRow = Record<string, string | undefined>;

type FieldMap = Record<keyof LeadInput, string[]>;

const fieldMap: FieldMap = {
  firstName: ["first_name", "firstname", "first"],
  lastName: ["last_name", "lastname", "last"],
  jobTitle: ["job_title", "title", "position"],
  companyName: ["company_name", "company", "organization", "org"],
  email: ["email", "email_address", "mail"],
  sector: ["sector", "business_category", "category", "industry"],
  city: ["city"],
  zipcode: ["zipcode", "zip", "postal_code"],
  country: ["country"],
  linkedinUrl: ["linkedin_url", "linkedin", "linkedin_profile", "linkedinprofile"],
  notes: ["notes", "context", "note"],
};

function getFirstValue(row: ParsedRow, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

/**
 * Validate parsed lead rows against BRD-required fields.
 *
 * Deduplication:
 * - We dedupe by email (case-insensitive).
 * - Duplicate rows are treated as invalid to avoid accidental double-sends.
 */
export function validateLeads(rows: ParsedRow[]): LeadValidationResult {
  const result: LeadValidationResult = { validLeads: [], errors: [] };

  const seenEmails = new Set<string>();

  for (let idx = 0; idx < rows.length; idx += 1) {
    const rowNumber = idx + 2; // +1 for 0-index, +1 because header is row 1
    const row = rows[idx] ?? {};

    const candidate: LeadInput = {
      firstName: getFirstValue(row, fieldMap.firstName) ?? "",
      lastName: getFirstValue(row, fieldMap.lastName) ?? "",
      jobTitle: getFirstValue(row, fieldMap.jobTitle) ?? "",
      companyName: getFirstValue(row, fieldMap.companyName) ?? "",
      email: getFirstValue(row, fieldMap.email) ?? "",
      sector: getFirstValue(row, fieldMap.sector),
      city: getFirstValue(row, fieldMap.city),
      zipcode: getFirstValue(row, fieldMap.zipcode),
      country: getFirstValue(row, fieldMap.country),
      linkedinUrl: getFirstValue(row, fieldMap.linkedinUrl),
      notes: getFirstValue(row, fieldMap.notes),
    };

    const parsed = leadInputSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        result.errors.push({
          rowNumber,
          field: issue.path.join(".") || "row",
          message: issue.message,
        });
      }
      continue;
    }

    const emailKey = parsed.data.email.toLowerCase();
    if (seenEmails.has(emailKey)) {
      result.errors.push({
        rowNumber,
        field: "email",
        message: "Duplicate email detected in upload",
      });
      continue;
    }
    seenEmails.add(emailKey);

    result.validLeads.push(parsed.data);
  }

  return result;
}
