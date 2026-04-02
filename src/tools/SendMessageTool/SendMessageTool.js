// Lightweight stub.
//
// In upstream builds this module is implemented in TypeScript and participates in
// broader tool orchestration. For this fork’s Node-based baseline tests we avoid
// importing Bun-dependent transitive modules by providing a minimal JS export.
export const SendMessageTool = {
  name: 'SendMessage',
  isEnabled: () => false,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  maxResultSizeChars: 0,
}

