const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const REPO = "United-World-College/UWC-Survival-Guide";
const LANG_MAP = {
  "en":    { name: "English",  folder: "default", sort: 1, suffix: "" },
  "zh-CN": { name: "简体中文", folder: "chinese", sort: 2, suffix: "-CN" },
  "zh-TW": { name: "台灣繁體", folder: "chinese", sort: 3, suffix: "-TW" },
};

module.exports = { db, FieldValue, REPO, LANG_MAP };
