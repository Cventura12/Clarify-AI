import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
};

const getEnv = (key: string) => {
  const value = process.env[key];
  return value && value.length > 0 ? value : null;
};

export const getR2Config = (): R2Config | null => {
  const accountId = getEnv("R2_ACCOUNT_ID");
  const accessKeyId = getEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getEnv("R2_SECRET_ACCESS_KEY");
  const bucket = getEnv("R2_BUCKET");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl: getEnv("R2_PUBLIC_URL") ?? undefined,
  };
};

const getClient = (config: R2Config) =>
  new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

export const uploadToR2 = async (
  config: R2Config,
  key: string,
  body: Buffer,
  contentType?: string
) => {
  const client = getClient(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const baseUrl = config.publicUrl ?? `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}`;
  return `${baseUrl}/${key}`;
};
