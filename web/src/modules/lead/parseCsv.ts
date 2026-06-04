type CsvRow = Record<string, string | undefined>;

function stripBom(input: string): string {
  return input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Minimal CSV parser with quoted-field support.
 *
 * Why custom:
 * - We avoid adding a CSV parsing dependency until BRD requires it.
 * - We only need a subset: commas + newlines + basic quoting.
 *
 * Limitations:
 * - Assumes comma delimiter (not semicolon).
 * - Handles CRLF/ LF.
 */
export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const content = stripBom(text).replace(/\r\n/g, "\n").trim();
  if (content.length === 0) return { headers: [], rows: [] };

  const lines: string[] = [];
  {
    // Split into lines while respecting quotes.
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < content.length; i += 1) {
      const ch = content[i] ?? "";
      const next = content[i + 1];

      if (ch === '"') {
        // Escaped quote inside quoted field: "" -> "
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }

      if (ch === "\n" && !inQuotes) {
        lines.push(current);
        current = "";
        continue;
      }

      current += ch;
    }
    lines.push(current);
  }

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i] ?? "";
      const next = line[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }

      if (ch === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
        continue;
      }

      current += ch;
    }
    cells.push(current.trim());
    return cells;
  };

  const rawHeaders = parseLine(lines[0] ?? "");
  const headers = rawHeaders.map(normalizeHeader);

  const rows: CsvRow[] = [];
  for (let idx = 1; idx < lines.length; idx += 1) {
    const values = parseLine(lines[idx] ?? "");
    const row: CsvRow = {};
    for (let h = 0; h < headers.length; h += 1) {
      const header = headers[h] ?? "";
      row[header] = values[h] ?? "";
    }
    rows.push(row);
  }

  return { headers, rows };
}
