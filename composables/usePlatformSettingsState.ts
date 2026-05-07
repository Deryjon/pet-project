type PlatformSettingsState = {
  language: string;
  timezone: string;
  minPasswordLength: number;
  sessionTimeout: number;
  notificationsEnabled: boolean;
};

const STORAGE_KEY = "platform_settings_state";

function defaultState(): PlatformSettingsState {
  return {
    language: "ru",
    timezone: "Asia/Tashkent",
    minPasswordLength: 8,
    sessionTimeout: 30,
    notificationsEnabled: true,
  };
}

export function usePlatformSettingsState() {
  const state = useState<PlatformSettingsState>("platform-settings-state", defaultState);

  function load() {
    if (!import.meta.client) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      state.value = { ...defaultState(), ...JSON.parse(raw) };
    } catch (_) {}
  }

  function save() {
    if (!import.meta.client) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));
    } catch (_) {}
  }

  return { state, load, save };
}
