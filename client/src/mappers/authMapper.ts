export function mapApiErrorMessage(
  response: { message?: string } | null,
  status: number,
): string {
  return response?.message ?? `Request failed with status ${status}`;
}
