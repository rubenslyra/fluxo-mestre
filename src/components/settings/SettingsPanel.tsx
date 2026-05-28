import { KeyRound, Settings2, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  clearStoredApiKeys,
  defaultAppSettings,
  loadAppSettings,
  readStoredApiKey,
  saveAppSettings,
  saveStoredApiKey,
  type AiProvider,
  type AppSettings,
} from "./appSettings";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const providerPresets: Record<
  AiProvider,
  { label: string; endpoint: string; model: string; note: string }
> = {
  "openai-compatible": {
    label: "OpenAI compatível",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4.1-mini",
    note: "Funciona também com gateways locais ou gestores que exponham /v1/chat/completions.",
  },
  gemini: {
    label: "Gemini REST",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
    model: "gemini-3.5-flash",
    note: "Use {model} no endpoint quando quiser trocar o modelo pelo campo abaixo.",
  },
};

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [apiKey, setApiKey] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = loadAppSettings();
    setSettings(next);
    setApiKey("");
    setHasStoredKey(Boolean(readStoredApiKey(next.ai.apiKeyStorage)));
    setSaved(false);
  }, [open]);

  const provider = providerPresets[settings.ai.provider];

  const storageLabel = useMemo(() => {
    if (settings.ai.apiKeyStorage === "local") return "navegador local";
    if (settings.ai.apiKeyStorage === "session") return "sessão atual";
    return "não salvar";
  }, [settings.ai.apiKeyStorage]);

  if (!open) return null;

  const updateAiProvider = (providerKey: AiProvider) => {
    const preset = providerPresets[providerKey];
    setSettings((current) => ({
      ...current,
      ai: {
        ...current.ai,
        provider: providerKey,
        endpoint: preset.endpoint,
        model: preset.model,
      },
    }));
  };

  const save = () => {
    const next = saveAppSettings(settings);
    if (apiKey.trim()) {
      saveStoredApiKey(next.ai.apiKeyStorage, apiKey);
    } else if (next.ai.apiKeyStorage === "none") {
      clearStoredApiKeys();
    }
    setHasStoredKey(Boolean(readStoredApiKey(next.ai.apiKeyStorage)));
    setApiKey("");
    setSaved(true);
  };

  const clearKey = () => {
    clearStoredApiKeys();
    setApiKey("");
    setHasStoredKey(false);
    setSaved(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Settings2 aria-hidden className="size-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">Configurações</h2>
              <p className="text-xs text-muted-foreground">Preferências locais deste navegador</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar configurações"
          >
            <X aria-hidden className="size-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="space-y-4">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Interface
              </h3>
              <div className="space-y-2 rounded-md border border-border bg-background p-3">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.ui.confirmBeforeClear}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        ui: { ...current.ui, confirmBeforeClear: event.target.checked },
                      }))
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">Confirmar limpeza do fluxo</span>
                    <span className="text-xs text-muted-foreground">
                      Mantém uma barreira antes de apagar todo o canvas.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.ui.reduceMotion}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        ui: { ...current.ui, reduceMotion: event.target.checked },
                      }))
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">Reduzir movimento</span>
                    <span className="text-xs text-muted-foreground">
                      Diminui transições visuais para leitura mais estável.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Modo IA
              </h3>
              <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border">
                {(
                  [
                    ["local", "Local"],
                    ["external", "API externa"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        ai: { ...current.ai, mode },
                      }))
                    }
                    className={`px-3 py-2 text-sm font-medium ${
                      settings.ai.mode === mode
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                O modo local atual permanece disponível e não envia dados para serviços externos.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound aria-hidden className="size-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Provedor externo
              </h3>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(providerPresets) as AiProvider[]).map((providerKey) => {
                const active = settings.ai.provider === providerKey;
                return (
                  <button
                    key={providerKey}
                    type="button"
                    onClick={() => updateAiProvider(providerKey)}
                    className={`rounded-md border p-3 text-left text-sm transition ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="block font-semibold">
                      {providerPresets[providerKey].label}
                    </span>
                    <span className="mt-1 block text-xs">{providerPresets[providerKey].note}</span>
                  </button>
                );
              })}
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Endpoint
              </span>
              <input
                value={settings.ai.endpoint}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    ai: { ...current.ai, endpoint: event.target.value },
                  }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Modelo
                </span>
                <input
                  value={settings.ai.model}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      ai: { ...current.ai, model: event.target.value },
                    }))
                  }
                  placeholder={provider.model}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Temperatura
                </span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.ai.temperature}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      ai: { ...current.ai, temperature: Number(event.target.value) },
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>

            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              Em uma publicação pública, prefira um proxy/servidor para proteger chaves. A opção
              abaixo é para uso local, laboratório ou gateway controlado pelo próprio usuário.
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Chave de API
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => {
                    setApiKey(event.target.value);
                    setSaved(false);
                  }}
                  placeholder={hasStoredKey ? `Chave salva em ${storageLabel}` : "Opcional"}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Armazenamento
                </span>
                <select
                  value={settings.ai.apiKeyStorage}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      ai: {
                        ...current.ai,
                        apiKeyStorage: event.target.value as AppSettings["ai"]["apiKeyStorage"],
                      },
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="none">Não salvar</option>
                  <option value="session">Sessão atual</option>
                  <option value="local">Navegador local</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={clearKey}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 aria-hidden className="size-4" />
                Limpar chave
              </button>
              <div className="flex items-center gap-2">
                {saved && <span className="text-xs text-emerald-600">Configurações salvas</span>}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Salvar
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
