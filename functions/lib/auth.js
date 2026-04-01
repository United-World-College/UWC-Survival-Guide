const { HttpsError } = require("firebase-functions/v2/https");
const { db } = require("./config");

let _adminEmailsCache = null;
let _adminEmailsCacheTime = 0;
const ADMIN_CACHE_TTL = 5 * 60 * 1000; // 5 min cache

async function getAdminEmails() {
  const now = Date.now();
  if (_adminEmailsCache && now - _adminEmailsCacheTime < ADMIN_CACHE_TTL) {
    return _adminEmailsCache;
  }
  const snap = await db.collection("config").doc("admins").get();
  if (!snap.exists || !Array.isArray(snap.data().emails)) {
    throw new HttpsError("internal", "Admin configuration not found.");
  }
  _adminEmailsCache = snap.data().emails;
  _adminEmailsCacheTime = now;
  return _adminEmailsCache;
}

function assertAuth(auth) {
  if (!auth) throw new HttpsError("unauthenticated", "Sign in required.");
}

async function assertAdmin(auth) {
  assertAuth(auth);
  if (auth.token.email_verified !== true) {
    throw new HttpsError("permission-denied", "Verified email required.");
  }
  const adminEmails = await getAdminEmails();
  if (!adminEmails.includes(auth.token.email)) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
}

module.exports = { getAdminEmails, assertAuth, assertAdmin };
