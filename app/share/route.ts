import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createInterpretedRequest } from "@/lib/requests/create-interpreted-request";

type SharePayload = {
  title?: string;
  text?: string;
  url?: string;
  fileNames: string[];
};

const getString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const collectFiles = (formData: FormData) => {
  const raw = [...formData.getAll("files"), ...formData.getAll("files[]")];
  return raw
    .filter((entry): entry is File => entry instanceof File)
    .map((file) => file.name.trim())
    .filter(Boolean);
};

const parseFormPayload = (formData: FormData): SharePayload => ({
  title: getString(formData.get("title")) || undefined,
  text: getString(formData.get("text")) || undefined,
  url: getString(formData.get("url")) || undefined,
  fileNames: collectFiles(formData),
});

const parseJsonPayload = (value: unknown): SharePayload => {
  const body = (value ?? {}) as Record<string, unknown>;
  return {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    text: typeof body.text === "string" ? body.text.trim() : undefined,
    url: typeof body.url === "string" ? body.url.trim() : undefined,
    fileNames: Array.isArray(body.files)
      ? body.files
          .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
          .filter(Boolean)
      : [],
  };
};

const buildRawInput = ({ title, text, url, fileNames }: SharePayload) => {
  const parts: string[] = [];
  if (title) parts.push(`Title: ${title}`);
  if (text) parts.push(text);
  if (url) parts.push(`URL: ${url}`);
  if (fileNames.length > 0) {
    parts.push(`Attachments: ${fileNames.join(", ")}`);
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

    const input = buildRawInput(payload);
    if (!input) {
      if (returnJson) {
        return Response.json(
          { error: { message: "Share payload must include text, url, title, or files" } },
          { status: 400 }
        );
      }
      return redirectTo(request, "/");
    }

    const created = await createInterpretedRequest({ userId, input });
    const requestPath = `/request/${created.requestId}`;

    if (returnJson) {
      return Response.json(
        {
          requestId: created.requestId,
          requestPath,
          fallback: created.fallback,
        },
        { status: 201 }
      );
    }

    return redirectTo(request, requestPath);
  } catch (error) {
    console.error("Share route error", error);
    if (returnJson) {
      return Response.json({ error: { message: "Failed to process shared content" } }, { status: 500 });
    }
    return redirectTo(request, "/");
  }
}

