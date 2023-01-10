/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 450;

const image1 = new Image();

image1.src = './pheasant.jpg';

image1.addEventListener('load', () => {
  ctx.drawImage(image1, 0, -200);

  const scannedImage =
    ctx.getImageData(0, 0, canvas.width, canvas.height);

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
  ctx.putImageData(scannedImage, 0, 0);
});

