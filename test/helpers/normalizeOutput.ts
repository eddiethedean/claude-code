import stripAnsi from 'strip-ansi'

export function normalizeStdout(s: string): string {
  const noAnsi = stripAnsi(s)
  return (
    noAnsi
      .replace(/\r\n/g, '\n')
      // Normalize common absolute paths for snapshot stability.
      .replaceAll(process.cwd(), '<WORKSPACE>')
      .replace(/\/var\/folders\/[^/\n]+\/[^/\n]+\/[^/\n]+/g, '<TMP>')
      .replace(/\/private\/var\/folders\/[^/\n]+\/[^/\n]+\/[^/\n]+/g, '<TMP>')
      // Redact durations that commonly vary run-to-run.
      .replace(/\b\d+ms\b/g, '<DURATION>')
  )
}

