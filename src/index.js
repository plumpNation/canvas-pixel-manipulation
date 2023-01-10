/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 450;

const image1 = new Image();

image1.src = './pheasant.jpg';

image1.addEventListener('load', () => {
  ctx.drawImage(image1, 0, 0);
});