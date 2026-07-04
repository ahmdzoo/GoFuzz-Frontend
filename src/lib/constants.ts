export const SEVERITY_MAP: Record<string, string> = {
  "🔴 Vulnerable": "High",
  "🟠 Suspicious": "Medium",
  "🟡 Check Needed": "Medium",
  "🟢 Safe": "Low",
  "⚪ Unknown": "Medium",
};

export function attackToSeverity(attack: string): string {
  if (attack === "SQL Injection" || attack === "Command Injection") return "🔴 Vulnerable";
  if (attack === "Cross-Site Scripting (XSS)" || attack === "XSS" || attack === "Path Traversal") return "🟠 Suspicious";
  if (attack === "Normal") return "🟢 Safe";
  return "⚪ Unknown";
}

export function severityToLevel(severity: string): string {
  if (!severity) return "Medium";
  const s = severity.toString();
  if (s.includes("Vulnerable") || s === "🔴 Vulnerable") return "High";
  if (s.includes("Suspicious") || s === "🟠 Suspicious") return "Medium";
  if (s.includes("Check Needed") || s === "🟡 Check Needed") return "Medium";
  if (s.includes("Safe") || s === "🟢 Safe") return "Low";
  return "Medium";
}
