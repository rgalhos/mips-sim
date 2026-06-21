import { persistentJSON } from "@nanostores/persistent";

const SIMULATOR_SETTINGS_STORAGE_KEY = "simulator_settings";

const defaultSettings = {
  stepSpeed: 1000,
  focusOnStep: false,
};

export const $settings = persistentJSON(SIMULATOR_SETTINGS_STORAGE_KEY, defaultSettings);
