const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

let _bucket = null;
function getBucket() {
  if (!_bucket) {
    const { getStorage } = require("firebase-admin/storage");
    _bucket = getStorage().bucket();
  }
  return _bucket;
}

const REPO = "United-World-College/UWC-Survival-Guide";
const LANG_MAP = {
  "en":    { name: "English",  folder: "default", sort: 1, suffix: "" },
  "zh-CN": { name: "简体中文", folder: "chinese", sort: 2, suffix: "-CN" },
  "zh-TW": { name: "台灣繁體", folder: "chinese", sort: 3, suffix: "-TW" },
};

module.exports = { db, FieldValue, getBucket, REPO, LANG_MAP };
