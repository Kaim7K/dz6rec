export async function validateSquareCover(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Não foi possível ler a capa. Selecione uma imagem válida."));
      image.src = url;
    });
    if (!dimensions.width || dimensions.width !== dimensions.height) throw new Error(`A capa precisa ser quadrada (1:1). Esta imagem tem ${dimensions.width} × ${dimensions.height}px. Selecione uma capa com largura e altura iguais.`);
  } finally { URL.revokeObjectURL(url); }
}
