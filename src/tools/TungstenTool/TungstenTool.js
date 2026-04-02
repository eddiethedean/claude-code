// Stub: TungstenTool is ant-only/internal in upstream builds.
// The leaked `src/` tree references it, but the implementation isn't present.
export const TungstenTool = {
  name: 'Tungsten',
  isEnabled: () => false,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  maxResultSizeChars: 0,
}

