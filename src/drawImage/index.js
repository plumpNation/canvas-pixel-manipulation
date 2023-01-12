const {
  canvas: dcanvas,
  ctx: dctx,
} = get2DCanvas('canvas1', {
  width: 800,
  height: 450,
});

const image1 = new Image();

image1.src = '../pheasant.jpg';

image1.addEventListener('load', () => {
  dctx.drawImage(image1, 0, -200);

  const scannedImage =
    dctx.getImageData(0, 0, dcanvas.width, dcanvas.height);

  const pixels = scannedImage.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const total =
      pixels[i] +
      pixels[i + 1] +
      pixels[i + 2];

    const avgColor = total / 3;

    pixels[i] = pixels[i + 1] = pixels[i + 2] = avgColor;
  }

  scannedImage.data = pixels;
  dctx.putImageData(scannedImage, 0, 0);
});
