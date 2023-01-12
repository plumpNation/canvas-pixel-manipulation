// @ts-check
/** @type {HTMLElement | null} */
const canvas = document.getElementById('canvas1');

if (!canvas) {
  throw new Error("canvas was not found");
}

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new TypeError("element supplied as canvas must be an HTMLCanvasElement");
}

const ctx = canvas.getContext('2d');

if (!ctx) {
  throw new Error("canvas.context could not be created");
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
  /**
   * @param {number} x
   * @param {number} y
   * @param {string} color
   */
  constructor(x, y, color) {
    /** @type {number} */
    this.x = Math.floor(x);

    /** @type {number} */
    this.y = Math.floor(y);

    /** @type {string} */
    this.color = color;

    // //////////////////////

    /** @type {number} */
    this.originX = Math.floor(x);

    /** @type {number} */
    this.originY = Math.floor(y);

    /** @type {number} */
    this.size = 1;

    /** @type {number} */
    this.vx = 0 // Math.random() * 2 - 1;

    /** @type {number} */
    this.vy = 0 // Math.random() * 2 - 1;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }
}

/**
 * The Effect class is really a controller for the effect
 * we are making here.
 */
class Effect {
  /**
   * @param {number} width
   * @param {number} height
   */
  constructor(width, height) {
    /** @type number */
    this.width = width;
    /** @type number */
    this.height = height;

    // //////////////////

    /** @type {Particle[]} */
    this.particles = [];
    /** @type number */
    this.centerX = width * 0.5;
    /** @type number */
    this.centerY = height * 0.5;
    /** @type number */
    this.gap = 1;
  }

  /**
   * Adds the image, centred, to the canvas, scans the pixel
   * information from it and then removes it.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {CanvasImageSource} image
   */
  getImagePixels(ctx, image) {
    const imageScale = 0.3;
    const imageWidth =  Number(image.width) * imageScale;
    const imageHeight = Number(image.height) * imageScale;
    // Centering the image within the Effect.
    // An image larger than the canvas will have it's edges cropped.
    const imageX = this.centerX - imageWidth * 0.5;
    const imageY = this.centerY - imageHeight * 0.5;

    ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight);

    const scanX = 0;
    const scanY = 0;
    const scanWidth = this.width;
    const scanHeight = this.height;

    // The Uint8ClampedArray of pixel data returned by
    // `ctx.getImageData().data` is one dimensional, meaning that
    // it holds only numbers in the range 0 - 255 (uint8).
    // It is clamped so adding a value larger than 255, say 256,
    // will not rollover to 0, it will be entered into the
    // array as 255. 255 is therefore the 'ceiling' value
    // and 0 the 'floor'.
    // The rgba values of a pixel are stored adjacent to each
    // other in the array, therefore every adjacent 4 elements
    // in the array are to be considered the colour information
    // for one individual pixel.
    const scannedImage = ctx.getImageData(
      scanX,
      scanY,
      scanWidth,
      scanHeight,
    );

    // We'll delete the area affected by the scan.
    // We could clear the entire canvas too, it depends
    // on the effect you want to achieve.
    ctx.clearRect(scanX, scanY, scanWidth, scanHeight);

    return {
      pixels: scannedImage.data,
      width: scanWidth,
      height: scanHeight,
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {CanvasImageSource} image
   */
  init(ctx, image) {
    const itemCountPerPixel = 4;

    const {
      pixels,
      width,
      height,
    } = this.getImagePixels(ctx, image);

    // Iterated one row at a time. We know the size of the scanned
    // area, both width and height.
    for (let y = 0; y < height; y += this.gap) {
      for (let x = 0; x < width; x += this.gap) {
        const rowStartIndex = y * this.width;
        const rowCurrentIndex = rowStartIndex + x;
        const index = rowCurrentIndex * itemCountPerPixel;

        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        // const alpha = pixels[index + 3]; ${alpha}

        const color = `rgb(${red}, ${green}, ${blue})`;

        this.particles.push(new Particle(x, y, color));
      }
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    for (let i = 0, len = this.particles.length; i < len; i += 1) {
      this.particles[i].draw(ctx);
    }
  }

  /**
   * Calls update on all items managed by this Effect,
   * in this case the particles.
   */
  update() {
    for (let i = 0, len = this.particles.length; i < length; i += 1) {
      this.particles[i].update();
    }
  }
}

let effect;

const animate = () => {
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect.draw(ctx, image1);
  // effect.update();

  // requestAnimationFrame(animate);
};

const image1 = new Image();

image1.addEventListener('load', () => {
  effect = new Effect(canvas.width, canvas.height);
  effect.init(ctx, image1);
  animate();
});

image1.src = '../pheasant.jpg';