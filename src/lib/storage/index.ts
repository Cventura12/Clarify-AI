export type StoredFile = {
  id: string;
  name: string;
  url: string;
};

export async function storeFile(name: string): Promise<StoredFile> {
  return {
    id: `file-${Date.now()}`,
    name,
    url: `https://storage.local/${encodeURIComponent(name)}`
  };
}
