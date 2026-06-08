export function isAlphaVantageRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("25 requests") ||
    lower.includes("spreading out") ||
    lower.includes("premium") ||
    lower.includes("api call frequency")
  );
}

export class AlphaVantageRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlphaVantageRateLimitError";
  }
}
