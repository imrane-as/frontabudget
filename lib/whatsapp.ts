type TemplateParameter = string | number;

export function isWhatsAppConfigured() {
  return Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_ACCESS_TOKEN
  );
}

export function normalizeWhatsAppPhone(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

export async function sendWhatsAppTemplate({
  to,
  template,
  parameters
}: {
  to: string;
  template: string;
  parameters: TemplateParameter[];
}) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "fr";

  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp Cloud API n’est pas configurée.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizeWhatsAppPhone(to),
        type: "template",
        template: {
          name: template,
          language: { code: language },
          components: [
            {
              type: "body",
              parameters: parameters.map((value) => ({
                type: "text",
                text: String(value)
              }))
            }
          ]
        }
      })
    }
  );

  const body = (await response.json()) as {
    messages?: Array<{ id: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(body.error?.message || "Échec de l’envoi WhatsApp.");
  }

  return body.messages?.[0]?.id || null;
}
