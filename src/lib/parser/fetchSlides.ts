const SLIDES_ID = "1-RKA5od3bC9XKj7hftgX7OiUbG5B2ZKiaaRYqSiWKNU";

export async function fetchSlidesText(): Promise<string> {
  const url = `https://docs.google.com/presentation/d/${SLIDES_ID}/export?format=txt`;
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch slides: ${response.status}`);
  }
  return response.text();
}
