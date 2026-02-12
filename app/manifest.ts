import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const baseManifest: MetadataRoute.Manifest = {
    name: "Clarify AI",
    short_name: "Clarify",
    description: "Personal execution layer",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0f17",
    theme_color: "#101827",
    icons: [
      {
        src: "/clarify-logo.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };

  (baseManifest as Record<string, unknown>).share_target = {
    action: "/share",
    method: "POST",
    enctype: "multipart/form-data",
    params: {
      title: "title",
      text: "text",
      url: "url",
      files: [
        {
          name: "files",
          accept: ["image/*", "application/pdf"],
        },
      ],
    },
  };

  return baseManifest;
}
