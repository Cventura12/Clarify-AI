export type FormField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "file";
  required: boolean;
  value?: string;
  source?: "profile" | "manual";
};

type ProfileLike = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  school?: string | null;
  graduationYear?: string | null;
  gpa?: string | null;
  linkedIn?: string | null;
};

const applyProfileValues = (fields: FormField[], profile?: ProfileLike | null) => {
  if (!profile) return fields;
  const map: Record<string, keyof ProfileLike> = {
    full_name: "fullName",
    email: "email",
    phone: "phone",
    address: "address",
    city: "city",
    state: "state",
    postal_code: "postalCode",
    country: "country",
    school: "school",
    graduation_year: "graduationYear",
    gpa: "gpa",
    linkedin: "linkedIn",
  };

  return fields.map((field) => {
    const key = map[field.id];
    const value = key ? profile[key] : null;
    if (!value) return field;
    return { ...field, value, source: "profile" };
  });
};

export const inferFormFields = (context: string, profile?: ProfileLike | null) => {
  const lower = context.toLowerCase();
  const fields: FormField[] = [];

  if (lower.includes("scholarship") || lower.includes("application")) {
    fields.push(
      { id: "full_name", label: "Full name", type: "text", required: true },
      { id: "email", label: "Email", type: "text", required: true },
      { id: "phone", label: "Phone", type: "text", required: false },
      { id: "address", label: "Address", type: "text", required: false },
      { id: "city", label: "City", type: "text", required: false },
      { id: "state", label: "State", type: "text", required: false },
      { id: "postal_code", label: "Postal code", type: "text", required: false },
      { id: "school", label: "School", type: "text", required: false },
      { id: "graduation_year", label: "Graduation year", type: "text", required: false },
      { id: "essay", label: "Personal essay", type: "textarea", required: false },
      { id: "transcript", label: "Transcript", type: "file", required: false }
    );
  }

  if (lower.includes("job") || lower.includes("application")) {
    fields.push(
      { id: "linkedin", label: "LinkedIn profile", type: "text", required: false },
      { id: "resume", label: "Resume", type: "file", required: true },
      { id: "cover_letter", label: "Cover letter", type: "textarea", required: false }
    );
  }

  if (fields.length === 0) {
    fields.push({ id: "notes", label: "Notes", type: "textarea", required: false });
  }

  return applyProfileValues(fields, profile);
};
