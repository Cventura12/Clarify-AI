import { prisma } from "@/lib/db";
import { getR2Config, uploadToR2 } from "@/lib/storage/r2";

type StoreArtifactInput = {
  name: string;
  content: string;
  type: "draft" | "document" | "form" | "other";
  contentType?: string;
  source?: string;
  stepId?: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const truncate = (value: string, max = 10000) => (value.length > max ? `${value.slice(0, max)}...` : value);

export const storeArtifact = async ({
  name,
  content,
  type,
  contentType,
  source = "system",
  stepId,
}: StoreArtifactInput) => {
  const config = getR2Config();
  const safeName = slugify(name) || "artifact";
  const key = `${type}/${Date.now()}-${safeName}`;

  let url = `local://artifacts/${encodeURIComponent(key)}`;

  if (config) {
    url = await uploadToR2(config, key, Buffer.from(content, "utf8"), contentType);
  }

  const record = await prisma.fileArtifact.create({
    data: {
      name,
      type,
      source,
      url,
      contentType,
      contentText: truncate(content),
      stepId,
    },
  });

  return record;
};
