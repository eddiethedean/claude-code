export function normalizeStdout(s: string): string {
  return s.replace(/\r\n/g, '\n')
}

