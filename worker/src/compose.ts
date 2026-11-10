// Turns a template plus one recipient into a ready-to-send email: fills in the
// personalisation variables and weaves in that recipient's unique tracking token.
//
// The token appears only inside URLs the server controls; the recipient's name and
// email never go into a tracking URL.
export type ComposeInput = {
  subject: string;
  html: string;
  target: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    department?: string | null;
  };
  companyName: string;
  token: string;
  apiBaseUrl: string;
};

export type ComposedEmail = { subject: string; html: string };

export function compose(input: ComposeInput): ComposedEmail {
  const clickUrl = `${input.apiBaseUrl}/c/${input.token}`;
  const pixelUrl = `${input.apiBaseUrl}/t/${input.token}`;
  const reportUrl = `${input.apiBaseUrl}/r/${input.token}`;

  const vars: Record<string, string> = {
    first_name: input.target.firstName ?? '',
    last_name: input.target.lastName ?? '',
    department: input.target.department ?? '',
    company: input.companyName,
    email: input.target.email,
    tracking_link: clickUrl,
    report_link: reportUrl,
  };

  // Replace {{ var }} tokens; unknown variables collapse to an empty string.
  const render = (text: string): string =>
    text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');

  const subject = render(input.subject);
  let html = render(input.html);

  // Guarantee a clickable, trackable link even if the template author forgot one.
  if (!html.includes(clickUrl)) {
    html += `\n<p><a href="${clickUrl}">View details</a></p>`;
  }
  // A 1x1 open-tracking pixel. The endpoints that record hits arrive in Phase 3.
  html += `\n<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none" />`;

  return { subject, html };
}
