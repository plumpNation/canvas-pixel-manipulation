/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
  /**
   * @param {Effect} effect
   */
  constructor(effect) {
    const [x, y, size] = effect.particleProperties();

    /** @type {number} */
    this.x = x;
    /** @type {number} */
    this.y = y;
    /** @type {number} */
    this.size = size;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

class Effect {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   */
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    /** @type {Particle[]} */
    this.particles = [];
  }

  init() {
    for (let i = 0; i < 10; i++) {
      this.particles.push(new Particle(this));
    }
  }

  particleProperties() {
    return [
      Math.random() * this.width,
      Math.random() * this.width,
      Math.random() * 100,
    ]
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Image} image
   */
  draw(ctx, image) {
    this.particles.forEach(p => p.draw(ctx));

    ctx.drawImage(image, 100, 100, image.width / 2, image.height / 2);
  }
}

const effect = new Effect(canvas.width, canvas.height);

effect.init();

this.image1 = new Image();

image1.src = '../pheasant.jpg';

image1.addEventListener('load', () => {
  effect.draw(ctx, image1);
});

const animate = () => {

};
