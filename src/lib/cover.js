import { uploadFile } from "./music.js";

async function readSquareCover(file) {
  const url = URL.createObjectURL(file);
  try {
    /** @type {HTMLImageElement} */
    const image = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Não foi possível ler a capa. Selecione uma imagem válida."));
      image.src = url;
    });
    const { naturalWidth: width, naturalHeight: height } = image;
    if (!width || width !== height) throw new Error(`A capa precisa ser quadrada (1:1). Esta imagem tem ${width} × ${height}px. Selecione uma capa com largura e altura iguais.`);
    return image;
  } finally { URL.revokeObjectURL(url); }
}

export async function validateSquareCover(file) {
  if (file) await readSquareCover(file);
}

export async function uploadProjectCover(file) {
  const image = await readSquareCover(file);
  const cover_url = await uploadFile(file);
  let cover_thumbnail_url = "";
  if (image.naturalWidth > 512) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 512;
      canvas.getContext("2d").drawImage(image, 0, 0, 512, 512);
      /** @type {Blob | null} */
      const thumbnail = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", 0.82));
      if (thumbnail?.type === "image/webp" && thumbnail.size < file.size) {
        cover_thumbnail_url = await uploadFile(new File([thumbnail], "capa-miniatura.webp", { type: thumbnail.type }));
      }
    } catch {
      // Keep the original cover available when thumbnail processing or upload fails.
    }
  }
  return { cover_url, cover_thumbnail_url };
}
