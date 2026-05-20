import { ThemeDefinition, ThemeId, ThemeMode } from "@/lib/types"

export const themeRegistry: Record<ThemeId, ThemeDefinition> = {
  base: {
    id: "base",
    name: "Default Garden",
    tagline: "Теплый и спокойный",
    price: 0,
    description: "Кремовый garden-интерфейс с мягким контрастом и спокойной глубиной.",
    preview: {
      accent: "#7db856",
      secondary: "#e3c27d",
      surface: "rgba(255,250,242,0.88)"
    },
    tokens: {
      light: {
        "--background": "#f7f1e6",
        "--background-elevated": "rgba(255,252,246,0.82)",
        "--background-muted": "rgba(255,250,242,0.72)",
        "--foreground": "#2a241f",
        "--foreground-soft": "#7b7064",
        "--border-color": "rgba(96,78,58,0.12)",
        "--accent": "#7db856",
        "--accent-soft": "rgba(125,184,86,0.14)",
        "--accent-strong": "#4c8f33",
        "--board-shell": "rgba(255,253,249,0.92)",
        "--board-cell": "rgba(255,255,255,0.92)",
        "--board-cell-hover": "rgba(143,199,100,0.14)",
        "--board-cell-active": "rgba(125,184,86,0.18)",
        "--board-given": "#30271f",
        "--board-user": "#5671c9",
        "--board-note": "#9a8f82",
        "--board-conflict": "rgba(216,106,99,0.16)",
        "--reward": "linear-gradient(135deg, rgba(125,184,86,0.18), rgba(255,209,131,0.24))"
      },
      dark: {
        "--background": "#1a1815",
        "--background-elevated": "rgba(33,28,24,0.84)",
        "--background-muted": "rgba(41,35,30,0.78)",
        "--foreground": "#f6efe4",
        "--foreground-soft": "#b8ac9d",
        "--border-color": "rgba(255,245,230,0.10)",
        "--accent": "#a2da72",
        "--accent-soft": "rgba(162,218,114,0.14)",
        "--accent-strong": "#78bf4d",
        "--board-shell": "rgba(39,33,28,0.90)",
        "--board-cell": "rgba(48,41,35,0.92)",
        "--board-cell-hover": "rgba(162,218,114,0.12)",
        "--board-cell-active": "rgba(162,218,114,0.18)",
        "--board-given": "#fff8ef",
        "--board-user": "#e6d1ff",
        "--board-note": "#bdaa97",
        "--board-conflict": "rgba(216,106,99,0.18)",
        "--reward": "linear-gradient(135deg, rgba(162,218,114,0.18), rgba(245,192,116,0.18))"
      }
    }
  },
  ocean: {
    id: "ocean",
    name: "Ocean Glass",
    tagline: "Глубина и спокойствие",
    price: 300,
    description: "Глубокие синие стеклянные панели, мягкое свечение и медленная океанская пластика.",
    preview: {
      accent: "#33b6ff",
      secondary: "#5ce1e6",
      surface: "rgba(7,18,44,0.76)"
    },
    tokens: {
      light: {
        "--background": "#e9f5ff",
        "--background-elevated": "rgba(255,255,255,0.32)",
        "--background-muted": "rgba(255,255,255,0.18)",
        "--foreground": "#f6fbff",
        "--foreground-soft": "#d0e8ff",
        "--border-color": "rgba(179,229,255,0.18)",
        "--accent": "#38bdf8",
        "--accent-soft": "rgba(56,189,248,0.18)",
        "--accent-strong": "#1d4ed8",
        "--board-shell": "rgba(8,20,52,0.72)",
        "--board-cell": "rgba(13,32,73,0.68)",
        "--board-cell-hover": "rgba(56,189,248,0.18)",
        "--board-cell-active": "rgba(125,211,252,0.24)",
        "--board-given": "#f8fdff",
        "--board-user": "#7dd3fc",
        "--board-note": "#d0f1ff",
        "--board-conflict": "rgba(248,113,113,0.22)",
        "--reward": "linear-gradient(135deg, rgba(56,189,248,0.24), rgba(99,102,241,0.24))"
      },
      dark: {
        "--background": "#020c1c",
        "--background-elevated": "rgba(7,18,44,0.72)",
        "--background-muted": "rgba(6,16,39,0.60)",
        "--foreground": "#ecfbff",
        "--foreground-soft": "#b9d9f3",
        "--border-color": "rgba(125,211,252,0.18)",
        "--accent": "#33b6ff",
        "--accent-soft": "rgba(51,182,255,0.18)",
        "--accent-strong": "#5ce1e6",
        "--board-shell": "rgba(4,16,40,0.86)",
        "--board-cell": "rgba(6,27,66,0.82)",
        "--board-cell-hover": "rgba(51,182,255,0.18)",
        "--board-cell-active": "rgba(92,225,230,0.22)",
        "--board-given": "#ffffff",
        "--board-user": "#8ddfff",
        "--board-note": "#b7d7ef",
        "--board-conflict": "rgba(248,113,113,0.22)",
        "--reward": "linear-gradient(135deg, rgba(51,182,255,0.18), rgba(92,225,230,0.18))"
      }
    }
  },
  sunnyBlue: {
    id: "sunnyBlue",
    name: "Sunny Blue",
    tagline: "Легкая игровая энергия",
    price: 500,
    description: "Желто-синий playful UI с округлыми формами, без кричащего визуального шума.",
    preview: {
      accent: "#2563eb",
      secondary: "#facc15",
      surface: "rgba(255,255,255,0.86)"
    },
    tokens: {
      light: {
        "--background": "#fff8db",
        "--background-elevated": "rgba(255,255,255,0.74)",
        "--background-muted": "rgba(255,251,226,0.76)",
        "--foreground": "#16315a",
        "--foreground-soft": "#4f6585",
        "--border-color": "rgba(22,49,90,0.10)",
        "--accent": "#2563eb",
        "--accent-soft": "rgba(37,99,235,0.14)",
        "--accent-strong": "#f0b100",
        "--board-shell": "rgba(255,255,255,0.86)",
        "--board-cell": "rgba(255,250,222,0.90)",
        "--board-cell-hover": "rgba(250,204,21,0.16)",
        "--board-cell-active": "rgba(37,99,235,0.16)",
        "--board-given": "#13315d",
        "--board-user": "#2563eb",
        "--board-note": "#64748b",
        "--board-conflict": "rgba(239,68,68,0.18)",
        "--reward": "linear-gradient(135deg, rgba(250,204,21,0.22), rgba(37,99,235,0.16))"
      },
      dark: {
        "--background": "#151628",
        "--background-elevated": "rgba(23,26,46,0.82)",
        "--background-muted": "rgba(31,35,58,0.70)",
        "--foreground": "#fff8db",
        "--foreground-soft": "#dad9cb",
        "--border-color": "rgba(250,204,21,0.12)",
        "--accent": "#ffcc29",
        "--accent-soft": "rgba(255,204,41,0.14)",
        "--accent-strong": "#3b82f6",
        "--board-shell": "rgba(26,32,56,0.88)",
        "--board-cell": "rgba(36,42,72,0.88)",
        "--board-cell-hover": "rgba(255,204,41,0.14)",
        "--board-cell-active": "rgba(59,130,246,0.18)",
        "--board-given": "#fffef6",
        "--board-user": "#ffd54f",
        "--board-note": "#cbd5e1",
        "--board-conflict": "rgba(248,113,113,0.22)",
        "--reward": "linear-gradient(135deg, rgba(255,204,41,0.18), rgba(59,130,246,0.18))"
      }
    }
  }
}

export const themeOrder: ThemeId[] = ["base", "ocean", "sunnyBlue"]

export function getThemeTokens(themeId: ThemeId, mode: ThemeMode) {
  return themeRegistry[themeId].tokens[mode]
}
