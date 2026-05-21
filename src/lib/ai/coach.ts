import OpenAI from "openai"
import { CoachExplanation } from "@/lib/types"
import { CoachAnalysis, ExplainMoveInput, explainMove, analyzeMove } from "@/lib/sudoku/coach"

type AIProvider = "openai" | "openrouter"

const OPENAI_MODEL = process.env.OPENAI_COACH_MODEL?.trim() || "gpt-4.1"
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL?.trim() ||
  (OPENAI_MODEL.includes("/") || OPENAI_MODEL.startsWith("~")
    ? OPENAI_MODEL
    : `openai/${OPENAI_MODEL === "gpt-4.1" ? "gpt-4.1-mini" : OPENAI_MODEL}`)

const coachExplanationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    strategy: { type: "string" },
    candidateList: {
      type: "array",
      items: { type: "integer" }
    },
    recommendedValue: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    invalidReason: {
      anyOf: [{ type: "string" }, { type: "null" }]
    }
  },
  required: ["title", "summary", "strategy", "candidateList", "recommendedValue", "invalidReason"]
} as const

let aiClient:
  | {
      client: OpenAI
      provider: AIProvider
      model: string
    }
  | null
  | undefined

function getOpenRouterKey() {
  const explicit = process.env.OPENROUTER_API_KEY?.trim()
  if (explicit) {
    return explicit
  }

  const reusedOpenAIKey = process.env.OPENAI_API_KEY?.trim()
  if (reusedOpenAIKey?.startsWith("sk-or-")) {
    return reusedOpenAIKey
  }

  return null
}

function getAIClient() {
  if (aiClient !== undefined) {
    return aiClient
  }

  const openRouterKey = getOpenRouterKey()
  if (openRouterKey) {
    aiClient = {
      provider: "openrouter",
      model: OPENROUTER_MODEL,
      client: new OpenAI({
        apiKey: openRouterKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
          "X-Title": "Sudoku Mind Garden"
        }
      })
    }
    return aiClient
  }

  const openAIKey = process.env.OPENAI_API_KEY?.trim()
  aiClient = openAIKey
    ? {
        provider: "openai",
        model: OPENAI_MODEL,
        client: new OpenAI({ apiKey: openAIKey })
      }
    : null

  return aiClient
}

function sanitizeCoachExplanation(
  raw: Partial<CoachExplanation>,
  fallback: CoachExplanation,
  analysis: CoachAnalysis,
  source: "openai" | "openrouter"
): CoachExplanation {
  return {
    title: raw.title?.trim() || fallback.title,
    summary: raw.summary?.trim() || fallback.summary,
    strategy: raw.strategy?.trim() || fallback.strategy,
    candidateList:
      raw.candidateList?.filter(
        (value): value is number => Number.isInteger(value) && value >= 1 && value <= 9
      ) ?? analysis.candidates,
    recommendedValue:
      raw.recommendedValue === null || raw.recommendedValue === undefined
        ? fallback.recommendedValue
        : Number.isInteger(raw.recommendedValue)
          ? raw.recommendedValue
          : fallback.recommendedValue,
    invalidReason: raw.invalidReason?.trim() || fallback.invalidReason,
    source
  }
}

function buildPrompt(input: ExplainMoveInput, analysis: CoachAnalysis) {
  return [
    "Объясни ход в судоку по-русски коротко и полезно.",
    "Не выдумывай новые факты. Используй только переданные данные.",
    "Тон: умный, дружелюбный, короткий, как AI coach в премиум-продукте.",
    "Не используй длинные абзацы. Summary и strategy должны быть максимум 1-2 предложениями.",
    "Используй координаты как на доске: буква колонки A-I и номер ряда 1-9, например C8.",
    "Никогда не используй технический формат R3C8, Row/Column или R/C-нотацию.",
    "",
    `Клетка: ${analysis.cellLabel}`,
    `Исходная клетка пазла: ${analysis.given ? "да" : "нет"}`,
    `Текущее значение в клетке: ${analysis.value ?? "пусто"}`,
    `Рекомендуемое значение: ${analysis.recommendedValue ?? "нет"}`,
    `Правильное значение по решению: ${analysis.solutionValue ?? "неизвестно"}`,
    `Кандидаты: ${analysis.candidates.length > 0 ? analysis.candidates.join(", ") : "нет"}`,
    `Конфликты: ${analysis.conflicts.length > 0 ? analysis.conflicts.join(" ") : "нет"}`,
    `Числа в строке: ${analysis.rowValues.join(", ") || "нет"}`,
    `Числа в столбце: ${analysis.columnValues.join(", ") || "нет"}`,
    `Числа в квадрате 3x3: ${analysis.boxValues.join(", ") || "нет"}`,
    `Полная сетка:\n${input.grid.map((row) => row.join(" ")).join("\n")}`
  ].join("\n")
}

export async function explainMoveWithAI(input: ExplainMoveInput): Promise<CoachExplanation> {
  const fallback = explainMove(input)
  const runtime = getAIClient()
  if (!runtime) {
    return {
      ...fallback,
      source: "fallback"
    }
  }

  const analysis = analyzeMove(input)

  try {
    if (runtime.provider === "openrouter") {
      const completion = await runtime.client.chat.completions.create({
        model: runtime.model,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content:
              "Ты AI Coach для Sudoku. Твоя задача — объяснять ходы очень ясно, коротко и только на основе предоставленных фактов. Не придумывай кандидаты, конфликты или решения."
          },
          {
            role: "user",
            content: buildPrompt(input, analysis)
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "coach_explanation",
            strict: true,
            schema: coachExplanationSchema
          }
        }
      })

      const content = completion.choices[0]?.message?.content?.trim()
      if (!content) {
        return {
          ...fallback,
          source: "fallback"
        }
      }

      const parsed = JSON.parse(content) as Partial<CoachExplanation>
      return sanitizeCoachExplanation(parsed, fallback, analysis, "openrouter")
    }

    const response = await runtime.client.responses.create({
      model: runtime.model,
      input: [
        {
          role: "system",
          content:
            "Ты AI Coach для Sudoku. Твоя задача — объяснять ходы очень ясно, коротко и только на основе предоставленных фактов. Не придумывай кандидаты, конфликты или решения."
        },
        {
          role: "user",
          content: buildPrompt(input, analysis)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "coach_explanation",
          strict: true,
          schema: coachExplanationSchema
        }
      }
    })

    const content = response.output_text?.trim()
    if (!content) {
      return {
        ...fallback,
        source: "fallback"
      }
    }

    const parsed = JSON.parse(content) as Partial<CoachExplanation>
    return sanitizeCoachExplanation(parsed, fallback, analysis, "openai")
  } catch {
    return {
      ...fallback,
      source: "fallback"
    }
  }
}
