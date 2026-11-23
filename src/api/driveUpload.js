const audioTypes = {
  aac: "audio/aac", aif: "audio/aiff", aiff: "audio/aiff", flac: "audio/flac", m4a: "audio/mp4",
  mp3: "audio/mpeg", oga: "audio/ogg", ogg: "audio/ogg", opus: "audio/opus", wav: "audio/wav", webm: "audio/webm",
};

export async function uploadAudioToDrive(file, request, onProgress) {
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  const type = file.type.startsWith("audio/") ? file.type : audioTypes[extension];
  if (!type) throw new Error("Selecione um arquivo de áudio válido.");
  const { asset, url } = await request("/api/drive/start", {
    method: "POST", body: JSON.stringify({ name: file.name, size: file.size, type }),
  });
  const fileId = await new Promise((resolve, reject) => {
    const upload = new XMLHttpRequest();
    const fail = () => reject(new Error("Não foi possível enviar o áudio ao Google Drive. Confira sua conexão e o espaço disponível."));
    upload.open("PUT", url);
    upload.timeout = 20 * 60 * 1000;
    upload.responseType = "json";
    upload.setRequestHeader("Content-Type", type);
    upload.upload.onprogress = event => {
      if (event.lengthComputable) onProgress?.(Math.min(99, Math.round(event.loaded / event.total * 100)));
    };
    upload.onload = () => {
      if (upload.status < 200 || upload.status >= 300 || !upload.response?.id) return fail();
      resolve(upload.response.id);
    };
    upload.onerror = upload.onabort = upload.ontimeout = fail;
    upload.send(file);
  });
  const result = await request("/api/drive/finish", {
    method: "POST", body: JSON.stringify({ asset, fileId }),
  });
  onProgress?.(100);
  return result;
}
