import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./en";
import { ja } from "./ja";

const resources = {
  en,
  ja,
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ja", // Default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already does escaping
  },
});

export default i18n;
