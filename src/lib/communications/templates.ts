export type EmailTemplateKey = "follow_up" | "application_update" | "reminder";

    export type EmailDraft = {
      subject: string;
      body: string;
    };

    type TemplateInput = {
      recipientName?: string;
      context?: string;
      senderName?: string;
      deadline?: string;
    };

    const defaultInput: Required<TemplateInput> = {
      recipientName: "there",
      context: "the task",
      senderName: "Caleb",
      deadline: "soon"
    };

    export function renderEmailTemplate(
      key: EmailTemplateKey,
      input: TemplateInput = {}
    ): EmailDraft {
      const data = { ...defaultInput, ...input };

      switch (key) {
        case "application_update":
          return {
            subject: "Quick update on my application",
            body: `Hi ${data.recipientName},

I wanted to share a quick update regarding ${data.context}. Please let me know if there is anything else you need from me.

Thanks,
${data.senderName}`
          };
        case "reminder":
          return {
            subject: "Friendly reminder",
            body: `Hi ${data.recipientName},

Just a quick reminder about ${data.context}. The target timeline is ${data.deadline}.

Best,
${data.senderName}`
          };
        case "follow_up":
        default:
          return {
            subject: "Following up",
            body: `Hi ${data.recipientName},

I'm following up on ${data.context}. Please let me know if there are next steps I should take.

Thanks,
${data.senderName}`
          };
      }
    }
