const HUGGINGFACE_TOKEN = String(process.env.NEXT_PUBLIC_HUGGINGFACE_TOKEN);
const HUGGINGFACE_MODEL = String(process.env.NEXT_PUBLIC_HUGGINGFACE_MODEL);

export type Message = {
  ok?: boolean;
  status?: number | null;
  name?: string | undefined;
  message?: string | undefined;
};

export async function generateImageWithRetry(
  data: { inputs: string },
  signal: AbortSignal
): Promise<Blob | null | Message> {
  try {
    const response = await fetch(HUGGINGFACE_MODEL, {
      signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
        "Content-Type": "application/json",
        "x-use-cache": "false",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();

      const error = {
        ok: response.ok,
        status: response.status,
        message: JSON.parse(text).error,
      };
      return error;
    }

    const result = await response.blob();
    return result;
  } catch (error: any) {
    // console.error(error);
    return {
      ok: false,
      status: error.code,
      name: error.name,
      message: error.message,
    };
  }
}
