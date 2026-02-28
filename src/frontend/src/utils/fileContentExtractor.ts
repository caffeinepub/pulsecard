/**
 * Extracts a readable text summary from an uploaded file.
 * - Plain text / CSV / JSON: reads raw text and trims to a gist.
 * - PDF: extracts printable ASCII characters from the raw bytes.
 * - Images / Audio / Video: returns a descriptive placeholder.
 */
export async function extractFileSummary(file: File): Promise<string> {
  const { type, name, size } = file;

  // ── Plain text, CSV, JSON, XML ──────────────────────────────────────────
  if (
    type.startsWith("text/") ||
    type === "application/json" ||
    type === "application/xml" ||
    name.endsWith(".csv") ||
    name.endsWith(".txt") ||
    name.endsWith(".json")
  ) {
    const text = await file.text();
    return trimToGist(text, 300);
  }

  // ── PDF ─────────────────────────────────────────────────────────────────
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return await extractPdfText(file);
  }

  // ── Images ──────────────────────────────────────────────────────────────
  if (type.startsWith("image/")) {
    const ext = name.split(".").pop()?.toUpperCase() ?? "image";
    return `${ext} file (${formatSize(size)}) — visual medical record or scan.`;
  }

  // ── Audio ────────────────────────────────────────────────────────────────
  if (type.startsWith("audio/")) {
    return `Audio recording (${formatSize(size)}) — may contain dictated notes or consultations.`;
  }

  // ── Video ────────────────────────────────────────────────────────────────
  if (type.startsWith("video/")) {
    return `Video file (${formatSize(size)}) — may contain procedural footage or patient walkthrough.`;
  }

  return `File "${name}" (${formatSize(size)}) — no text preview available.`;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Trims a long string to a readable gist of roughly `maxChars` characters,
 * collapsing whitespace and ending on a word boundary.
 */
function trimToGist(raw: string, maxChars = 300): string {
  // Collapse runs of whitespace / newlines to single spaces
  const clean = raw.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  // Cut at last space before limit so we don't chop a word
  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}

/**
 * Very lightweight PDF text extraction: reads the raw bytes as Latin-1,
 * then pulls out runs of printable ASCII that look like real words.
 * Good enough for lab reports, prescriptions, and typed documents.
 */
async function extractPdfText(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Decode as Latin-1 so every byte maps to a character
    const raw = Array.from(bytes)
      .map((b) => String.fromCharCode(b))
      .join("");

    // Extract text between BT...ET blocks (PDF text objects)
    const btBlocks = raw.match(/BT[\s\S]*?ET/g) ?? [];
    let extracted = "";
    for (const block of btBlocks) {
      // Pull out strings inside parentheses like (Hello world)
      const parens = block.match(/\(([^)]{1,200})\)/g) ?? [];
      for (const p of parens) {
        const inner = p.slice(1, -1).replace(/\\[nrt\\()]/g, " ");
        // Keep only printable ASCII (32–126)
        const printable = inner.replace(/[^\x20-\x7E]/g, "");
        if (printable.trim().length > 3) extracted += `${printable} `;
      }
    }

    // Fallback: scan for long runs of printable ASCII if BT/ET gave nothing
    if (extracted.trim().length < 20) {
      const fallback = raw.match(/[\x20-\x7E]{5,}/g) ?? [];
      extracted = fallback
        .filter((s) => /[a-zA-Z]{3,}/.test(s)) // must contain real words
        .join(" ");
    }

    const gist = trimToGist(extracted.trim(), 300);
    return gist.length > 10
      ? gist
      : `PDF document (${formatSize(file.size)}) — text could not be extracted automatically.`;
  } catch {
    return `PDF document (${formatSize(file.size)}) — text could not be extracted automatically.`;
  }
}
