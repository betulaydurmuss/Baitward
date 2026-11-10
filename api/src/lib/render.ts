// Fills {{ variable }} placeholders in a string from a map, collapsing unknown
// variables to empty. Shared by the landing-page renderer and anywhere else a
// template string needs personalising.
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}
