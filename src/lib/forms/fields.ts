export type FormField = {
  name: string;
  value: string;
};

export type UserProfile = {
  fullName?: string;
  email?: string;
  phone?: string;
};

const defaultProfile: Required<UserProfile> = {
  fullName: "Caleb",
  email: "caleb@example.com",
  phone: "(555) 010-0000"
};

export function buildFormAutofill(fields: string[], profile?: UserProfile): FormField[] {
  const data = { ...defaultProfile, ...profile };

  return fields.map((field) => {
    const key = field.toLowerCase();
    if (key.includes("name")) return { name: field, value: data.fullName };
    if (key.includes("email")) return { name: field, value: data.email };
    if (key.includes("phone")) return { name: field, value: data.phone };
    return { name: field, value: "" };
  });
}
