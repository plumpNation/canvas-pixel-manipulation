const {
  canvas: pcanvas,
  ctx: pctx,
} = get2DCanvas('canvas1');

class Particle {
  x = 0;
  y = 0;
  color = 'black';
  vx = 0;
  vy = 0;

  /**
   *
   * @param {Effect} effect
   * @param {Object} options
   * @param {number} [options.x=0]
   * @param {number} [options.y=0]
   * @param {string} [options.color='black']
   */
  constructor(
    effect,
    {
      x,
      y,
      color,
    }
  ) {
    this.effect = effect;

    this.x = x || this.x;
    this.y = y || this.y;
    this.color = color || this.color;

    // //////////////////////

    this.originX = this.x | 0;
    this.originY = this.y | 0;
  }

  draw() {
    this.effect.ctx.fillStyle = this.color;

    this.effect.ctx.fillRect(
      this.x,
      this.y,
      this.effect.particleSize,
      this.effect.particleSize,
    );
  }

  update(speedRadius = 0) {
    const dx = this.effect.mouse.x - this.x;
    const dy = this.effect.mouse.y - this.y;

    // Euclidean distance (Pythagoras theorem) between the mouse position and the particle.
    // i.e.
    // C² = A² + B²
    // or
    // C = Math.sqrt(A² + B²) // worse performance, can change Mouse radius to compensate for not using it.
    const distance = dx * dx + dy * dy;

    // More distance is needed if particle is closer to the mouse position.
    const force = -speedRadius / distance;

    if (distance < speedRadius) {
      const angle = Math.atan2(dy, dx);

      this.vx += force * Math.cos(angle);
      this.vy += force * Math.sin(angle);
    }

    this.vx *= this.effect.friction
    this.vy *= this.effect.friction

    this.x += (this.vx + (this.originX - this.x) * this.effect.ease) | 0;
    this.y += (this.vy + (this.originY - this.y) * this.effect.ease) | 0;
  }

  /**
   * Provide width and height of the bounds to send the particles to
   * before the `update` method starts to bring them home.
   *
   * @param {number} width
   * @param {number} height
   */
  warp(width, height) {
    this.x = (Math.random() * width) | 0;
    this.y = (Math.random() * height) | 0;
  }
}

/**
 * The Effect class is really a controller for the effect
 * we are making here.
 */
class Effect {
  width = window.innerWidth;
  height = window.innerHeight;
  radius = 3000
  ease = 0.3
  friction = 0.9
  mouse = { x: 0, y: 0, vx: 0, vy: 0 };
  gap = 1;
  particleSize = 1;
  imageScale = 1;

  /** @type {Particle[]} */
  particles = [];

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {CanvasImageSource} image
   * @param {Object} options
   * @param {number} [options.width=window.innerWidth]
   * @param {number} [options.height=window.innerHeight]
   * @param {number} [options.ease=0.3]
   * @param {number} [options.friction=0.9]
   * @param {number} [options.gap = 1]
   * @param {number} [options.imageScale = 1]
   * @param {number} [options.particleSize = 1] Should be less than gap value
   * @param {number} [options.radius = 3000] How wide the effect of the mouse position is
   */
  constructor(ctx, image, { width, height, ease, friction, gap, imageScale, particleSize, radius }) {
    this.ctx = ctx;
    this.image = image;

    // ////////////////// optional

    this.width = width || this.width;
    this.height = height || this.width;
    this.ease = ease || this.ease;
    this.friction = friction || this.friction;
    this.gap = gap || this.gap;
    this.imageScale = imageScale || this.imageScale;
    this.particleSize = particleSize || this.particleSize;
    this.radius = radius || this.radius;

    // ////////////////// computed

    this.centerX = this.width * 0.5;
    this.centerY = this.height * 0.5;

    window.addEventListener('mousemove', event => {
      this.mouse.x = event.x;
      this.mouse.y = event.y;
      this.mouse.vx = event.movementX;
      this.mouse.vy = event.movementY;
    });
  }

  /**
   * Adds the image, centred, to the canvas, scans the pixel
   * information from it and then removes it.
   */
  #_getImagePixels() {
    const imageWidth =  Number(this.image.width) * this.imageScale;
    const imageHeight = Number(this.image.height) * this.imageScale;
    // Centering the image within the Effect.
    // An image larger than the canvas will have it's edges cropped.
    const imageX = this.centerX - imageWidth * 0.5;
    const imageY = this.centerY - imageHeight * 0.5;

    this.ctx.drawImage(this.image, imageX, imageY, imageWidth, imageHeight);

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
    const scannedImage = this.ctx.getImageData(
      scanX,
      scanY,
      scanWidth,
      scanHeight,
    );

    // We'll delete the area we wrote the image to.
    // We could clear the entire canvas too, it depends
    // on the effect you want to achieve.
    // We could add a canvas outside the view, and used that
    // as the source canvas for this data, if we needed to
    // not 'damage' pixel information on the currect canvas.
    // ctx.clearRect(imageX, imageY, imageWidth, imageHeight);

    return {
      pixels: scannedImage.data,
      width: scanWidth,
      height: scanHeight,
    }
  }

  init() {
    const itemCountPerPixel = 4; // refers to Uuint8ClampedArray elements per pixel

    const {
      pixels,
      width,
      height,
    } = this.#_getImagePixels();

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

        this.particles.push(new Particle(this, {
          x,
          y,
          color
        }));
      }
    }
  }

  draw() {
    for (let i = 0, len = this.particles.length; i < len; i += 1) {
      this.particles[i].draw();
    }
  }

  /**
   * Calls update on all items managed by this Effect,
   * in this case the particles.
   */
  update() {
    const speed = (
      Math.max(
        this.mouse.vx > 0 ? this.mouse.vx : this.mouse.vx * -1,
        this.mouse.vy > 0 ? this.mouse.vy : this.mouse.vy * -1,
      )
    ) | 0;

    for (let i = 0, len = this.particles.length; i < len; i += 1) {
      this.particles[i].update((this.radius * (speed * 2)) | 0);
    }
  }

  warp = () => {
    for (let i = 0, len = this.particles.length; i < len; i += 1) {
      this.particles[i].warp(this.width, this.height);
    }
  }
}

/** @type {Effect} */
let effect;

const animate = () => {
  requestAnimationFrame(animate);
  pctx.clearRect(0, 0, pcanvas.width, pcanvas.height);

  effect.update();
  effect.draw();
};

const src = '../pheasant.jpg';

loadImage(src)
  .then((image) => {
    effect = new Effect(
      pctx,
      image,
      {
        // HERE ARE THE KNOBS!!
        height: pcanvas.height,
        width: pcanvas.width,
        imageScale: 0.5,
        gap: 5,
        particleSize: 4,
        ease: 0.3,
        friction: 0.5,
        radius: 300,
      },
    );

    effect.init();
    animate();

    const warpButton = document.getElementById('warp-button');

    if (!warpButton) {
      throw new Error('No warp button found');
    }

    warpButton.addEventListener('click', effect.warp);
  });
