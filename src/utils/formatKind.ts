const UPPERCASE_KINDS = ['mcp', 'a2a', 'rest', 'api', 'soap', 'grpc'];

export function formatKindDisplay(kind: string): string {
  if (UPPERCASE_KINDS.includes(kind.toLowerCase())) {
    return kind.toUpperCase();
  }
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
