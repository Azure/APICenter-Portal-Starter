const UPPERCASE_KINDS = ['mcp', 'a2a', 'rest', 'api', 'soap', 'grpc'];

const CUSTOM_LABELS: Record<string, string> = {
  languagemodel: 'Model',
};

export function formatKindDisplay(kind: string): string {
  const lower = kind.toLowerCase();
  const custom = CUSTOM_LABELS[lower];
  if (custom) {
    return custom;
  }
  if (UPPERCASE_KINDS.includes(lower)) {
    return kind.toUpperCase();
  }
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
