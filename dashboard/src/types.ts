export type RawRow = Record<string, unknown>

export type NormalizedRow = {
  sessionId: string
  question: string
  answer: string
  questionTime: Date | null
  answerTime: Date | null
  intent: string
  projectName: string
  raw: RawRow
}

