type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

const textToHtml = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .map((line) => (line ? `<p>${line}</p>` : "<br />"))
    .join("");

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} environment variable`);
  }
  return value;
};

export const sendEmail = async ({ to, subject, text }: SendEmailInput) => {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("RESEND_FROM");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html: textToHtml(text),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Resend error: ${response.status} ${errorText}`);
  }

  return response.json().catch(() => ({}));
};
