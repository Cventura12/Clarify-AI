import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createInterpretedRequest } from "@/lib/requests/create-interpreted-request";
import { getR2Config, uploadToR2 } from "@/lib/storage/r2";

export const runtime = "nodejs";

type UploadedAttachment = {
  name: string;
  type: string;
  size: number;
  url: string;
};

type SharePayload = {
  title?: string;
  text?: string;
  url?: string;
  files: File[];
};

const MAX_FILE_BYTES = 15 * 1024 * 1024;

const getString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const sanitizeFilename = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const toKb = (size: number) => Math.max(1, Math.round(size / 1024));

const collectFiles = (formData: FormData) => {
  const raw = [...formData.getAll("files"), ...formData.getAll("files[]")];
  return raw.filter((entry): entry is File => entry instanceof File && entry.size > 0);
};

const parseFormPayload = (formData: FormData): SharePayload => ({
  title: getString(formData.get("title")) || undefined,
  text: getString(formData.get("text")) || undefined,
  url: getString(formData.get("url")) || undefined,
  files: collectFiles(formData),
});

const parseJsonPayload = (value: unknown): SharePayload => {
  const body = (value ?? {}) as Record<string, unknown>;
  return {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    text: typeof body.text === "string" ? body.text.trim() : undefined,
    url: typeof body.url === "string" ? body.url.trim() : undefined,
    files: [],
  };
};

const buildRawInput = ({
  title,
  text,
  url,
  attachments,
}: {
  title?: string;
  text?: string;
  url?: string;
  attachments: UploadedAttachment[];
}) => {
  const parts: string[] = [];
  if (title) parts.push(`Title: ${title}`);
  if (text) parts.push(text);
  if (url) parts.push(`URL: ${url}`);

  if (attachments.length > 0) {
    const list = attachments.map(
      (item) => `- ${item.name} (${item.type || "application/octet-stream"}, ${toKb(item.size)} KB) - ${item.url}`
    );
    parts.push(`Attachments:\n${list.join("\n")}`);
  }

  return parts.join("\n\n").trim();
};

const wantsJsonResponse = (request: Request) => {
  const accept = request.headers.get("accept") ?? "";
  const url = new URL(request.url);
  return accept.includes("application/json") || url.searchParams.get("format") === "json";
};

const redirectTo = (request: Request, path: string) =>
  NextResponse.redirect(new URL(path, request.url), { status: 303 });

const uploadShareFiles = async (requestId: string, files: File[]) => {
  if (files.length === 0) return [] as UploadedAttachment[];

  const config = getR2Config();
  if (!config) {
    throw new Error("Storage is not configured. Set R2_* env vars before sharing files.");
  }

  const uploaded: UploadedAttachment[] = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`File too large: ${file.name}. Limit is ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB.`);
    }

    const safeName = sanitizeFilename(file.name) || `attachment-${i + 1}`;
    const key = `requests/${requestId}/${Date.now()}-${i}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "application/octet-stream";
    const url = await uploadToR2(config, key, buffer, contentType);

    uploaded.push({
      name: file.name || safeName,
      type: contentType,
      size: file.size,
      url,
    });
  }

  return uploaded;
};

export async function GET(request: Request) {
  return redirectTo(request, "/");
}

export async function POST(request: Request) {
  const returnJson = wantsJsonResponse(request);

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      if (returnJson) {
        return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
      }
      return redirectTo(request, "/login");
    }

    const contentType = request.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? parseJsonPayload(await request.json().catch(() => null))
      : parseFormPayload(await request.formData());

    const hasContent = Boolean(payload.title || payload.text || payload.url || payload.files.length > 0);
    if (!hasContent) {
      if (returnJson) {
        return Response.json(
          { error: { message: "Share payload must include text, url, title, or files" } },
          { status: 400 }
        );
      }
      return redirectTo(request, "/");
    }

    const requestRecord = await prisma.request.create({
      data: {
        userId,
        rawInput: payload.text?.trim() || payload.url?.trim() || payload.title?.trim() || "Shared content",
      },
      select: { id: true },
    });

    let uploadedAttachments: UploadedAttachment[] = [];
    if (payload.files.length > 0) {
      uploadedAttachments = await uploadShareFiles(requestRecord.id, payload.files);
      await prisma.attachment.createMany({
        data: uploadedAttachments.map((file) => ({
          requestId: requestRecord.id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.url,
        })),
      });
    }

    const input = buildRawInput({
      title: payload.title,
      text: payload.text,
      url: payload.url,
      attachments: uploadedAttachments,
    });

    const created = await createInterpretedRequest({
      userId,
      input,
      requestId: requestRecord.id,
    });

    const requestPath = `/request/${created.requestId}`;

    if (returnJson) {
      return Response.json(
        {
          requestId: created.requestId,
          requestPath,
          fallback: created.fallback,
          attachments: uploadedAttachments,
        },
        { status: 201 }
      );
    }

    return redirectTo(request, requestPath);
  } catch (error) {
    console.error("Share route error", error);
    if (returnJson) {
      return Response.json(
        {
          error: {
            message:
              error instanceof Error ? error.message : "Failed to process shared content",
          },
        },
        { status: 500 }
      );
    }
    return redirectTo(request, "/");
  }
}

