const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { HttpsError } = require("firebase-functions/v2/https");
const { db } = require("./config");

const R2_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const R2_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

let _r2ConfigCache = null;
let _r2ConfigCacheTime = 0;
const R2_CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 min

async function getR2Config() {
  const now = Date.now();
  if (_r2ConfigCache && now - _r2ConfigCacheTime < R2_CONFIG_CACHE_TTL) {
    return _r2ConfigCache;
  }
  const doc = await db.collection("config").doc("r2").get();
  if (!doc.exists || !doc.data().accessKeyId || !doc.data().secretAccessKey) {
    throw new HttpsError("internal", "R2 configuration not found.");
  }
  _r2ConfigCache = doc.data();
  _r2ConfigCacheTime = now;
  return _r2ConfigCache;
}

async function getR2Client() {
  const config = await getR2Config();
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

async function uploadToR2(key, buffer, contentType) {
  const config = await getR2Config();
  const client = await getR2Client();
  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return `${config.publicUrlBase}/${key}`;
}

async function deleteFromR2(key) {
  const config = await getR2Config();
  const client = await getR2Client();
  await client.send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: key,
  }));
}

async function deleteMultipleFromR2(keys) {
  if (!keys || keys.length === 0) return;
  const config = await getR2Config();
  const client = await getR2Client();
  for (const key of keys) {
    await client.send(new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }));
  }
}

module.exports = {
  getR2Config,
  getR2Client,
  uploadToR2,
  deleteFromR2,
  deleteMultipleFromR2,
  R2_ALLOWED_TYPES,
  R2_MAX_SIZE,
};
