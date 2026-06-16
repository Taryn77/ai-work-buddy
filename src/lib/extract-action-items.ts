/**
 * Parses a markdown summary and extracts bullet items that fall under an
 * "Action Items" / "Next Steps" / "To Do" style heading. Falls back to all
 * top-level bullets if no such heading exists.
 */
export function extractActionItems(markdown: string): string[] {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const sectionRegex =
    /^(action items?|next steps?|to[\s-]?dos?|follow[\s-]?ups?|tasks?)\b/i;
  let inSection = false;
  let sawSection = false;
  const fromSection: string[] = [];
  const allBullets: string[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    if (headingMatch) {
      const heading = headingMatch[1].replace(/[*_`:]/g, "").trim();
      const isTarget = sectionRegex.test(heading);
      inSection = isTarget;
      if (isTarget) sawSection = true;
      continue;
    }
    // Bold-styled pseudo-heading e.g. **Action Items**
    const boldHeading = line.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (boldHeading) {
      const heading = boldHeading[1].trim();
      const isTarget = sectionRegex.test(heading);
      inSection = isTarget;
      if (isTarget) sawSection = true;
      continue;
    }

    const bullet =
      line.match(/^\s*[-*+]\s+\[[ xX]\]\s+(.*)$/) ||
      line.match(/^\s*[-*+]\s+(.*)$/) ||
      line.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet) {
      const text = bullet[1].replace(/\*\*/g, "").trim();
      if (text) {
        allBullets.push(text);
        if (inSection) fromSection.push(text);
      }
    }
  }

  return sawSection && fromSection.length > 0 ? fromSection : allBullets;
}

export const PLANNER_PREFILL_KEY = "planner:prefill";
