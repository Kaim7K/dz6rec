import { put } from "@vercel/blob/client";

const MULTIPART_THRESHOLD = 100 * 1024 * 1024;

function safeUploadPath(file) {
  const name = (file.name || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return `uploads/${Date.now()}-${name || "arquivo"}`;
}

export async function uploadFileToBlob(file, { request, onProgress }) {
  const pathname = safeUploadPath(file);
  const multipart = file.size > MULTIPART_THRESHOLD;
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Tempo limite do envio excedido. Verifique sua conexão e tente novamente."));
      controller.abort();
    }, multipart ? 15 * 60 * 1000 : 2 * 60 * 1000);
  });

  try {
    return await Promise.race([
      (async () => {
        // Fetch the token ourselves: the SDK hides the API's error/status and
        // does not forward the abort signal to its internal token request.
        const { clientToken } = await request("/api/upload", {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            type: "blob.generate-client-token",
            payload: { pathname, multipart, clientPayload: null },
          }),
        });
        controller.signal.throwIfAborted();
        if (!clientToken) throw new Error("O servidor não autorizou o envio do arquivo.");
        const blob = await put(pathname, file, {
          token: clientToken,
          access: "public",
          contentType: file.type || "application/octet-stream",
          multipart,
          abortSignal: controller.signal,
          onUploadProgress: ({ percentage }) => {
            if (!controller.signal.aborted) onProgress?.(Math.round(percentage || 0));
          },
        });
        controller.signal.throwIfAborted();
        onProgress?.(100);
        return { file_url: blob.url };
      })(),
      deadline,
    ]);
  } catch (error) {
    if (/failed to fetch|network|cors|load failed/i.test(error?.message || "")) {
      throw new Error("Não foi possível enviar o arquivo ao Vercel Blob. Verifique sua conexão ou tente novamente em alguns instantes.", { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
