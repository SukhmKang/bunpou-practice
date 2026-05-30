export function parseSseEvents(buffer) {
  const events = [];
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const part of parts) {
    const lines = part.split("\n");
    const event = lines
      .find((line) => line.startsWith("event:"))
      ?.slice("event:".length)
      .trim();
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trim())
      .join("\n");

    if (!event) continue;
    events.push({ event, data: data ? JSON.parse(data) : null });
  }

  return { events, remainder };
}
