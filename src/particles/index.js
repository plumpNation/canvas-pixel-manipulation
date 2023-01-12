const {
  canvas: pcanvas,
  ctx: pctx,
} = get2DCanvas('canvas1');

class Particle {
  /**
   * @param {number} x
   * @param {number} y
   * @param {string} color
   * @param {number} size
   * @param {number} ease
   */
  constructor(
    x,
    y,
    color = 'black',
    size = 1,
    ease = 0.1,
  ) {
    /** @type {number} */
    this.x = x;

    /** @type {number} */
    this.y = y;

    /** @type {string} */
    this.color = color || 'black';

    // //////////////////////

    /** @type {number} */
    this.originX = Math.floor(x);

    /** @type {number} */
    this.originY = Math.floor(y);

    /** @type {number} */
    this.size = size || 1;

    // /** @type {number} */
    // this.vx = 0 // Math.random() * 2 - 1;

    // /** @type {number} */
    // this.vy = 0 // Math.random() * 2 - 1;

    this.ease = ease;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  vx = 0;
  vy = 0;

  /**
   *
   * @param {Effect['mouse']} mouse
   * @param {number} radius
   * @param {number} friction
   */
  update(mouse, radius, friction) {
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;

    // Euclidean distance (Pythagoras theorem) between the mouse position and the particle.
    // i.e.
    // C² = A² + B²
    // or
    // C = Math.sqrt(A² + B²) // worse performance, can change Mouse radius to compensate for not using it.
    const distance = dx * dx + dy * dy;

    // More distance is needed if particle is closer to the mouse position.
    const force = -radius / distance;

    if (distance < radius) {
      const angle = Math.atan2(dy, dx);

      this.vx += force * Math.cos(angle);
      this.vy += force * Math.sin(angle);
    }

    this.vx *= friction
    this.vy *= friction

    this.x += this.vx + (this.originX - this.x) * this.ease;
    this.y += this.vy + (this.originY - this.y) * this.ease;
  }

  /**
   * Provide width and height of the bounds to send the particles too.
   * @param {number} width
   * @param {number} height
   */
  warp(width, height) {
    this.x = Math.random() * width
    this.y = Math.random() * height
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

    this.mouse = { x: 0, y: 0, vx: 0, vy: 0 };

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
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {CanvasImageSource} image
   * @param {number} imageScale
   */
  #_getImagePixels(ctx, image, imageScale) {
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

  #_initDefaults = { imageScale: 1, particleSize: 1, gap: 1 };

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {CanvasImageSource} image
   * @param {Object} [options]
   * @param {number} [options.gap = 1]
   * @param {number} [options.imageScale = 1]
   * @param {number} [options.particleSize = 1] Should be less than gap value
   */
  init(
    ctx,
    image,
    options,
  ) {
    const itemCountPerPixel = 4; // refers to Uuint8ClampedArray elements per pixel

    const {
      imageScale,
      particleSize,
      gap,
    } = { ...this.#_initDefaults, ...options };

    const {
      pixels,
      width,
      height,
    } = this.#_getImagePixels(ctx, image, imageScale);

    // Iterated one row at a time. We know the size of the scanned
    // area, both width and height.
    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const rowStartIndex = y * this.width;
        const rowCurrentIndex = rowStartIndex + x;
        const index = rowCurrentIndex * itemCountPerPixel;

        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        // const alpha = pixels[index + 3]; ${alpha}

        const color = `rgb(${red}, ${green}, ${blue})`;

        this.particles.push(new Particle(x, y, color, particleSize));
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
  update(radius = 1000, friction = 0.1) {
    const speed = Math.max(this.mouse.vx, this.mouse.vy);

    for (let i = 0, len = this.particles.length; i < len; i += 1) {
      this.particles[i].update(
        this.mouse,
        radius * (speed * 2),
        friction,
      );
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
  pctx.clearRect(0, 0, pcanvas.width, pcanvas.height);
  effect.draw(pctx);
  effect.update();

  // requestAnimationFrame(animate);
};

const src = '../pheasant.jpg';

loadImage(src)
  .then((image) => {
    effect = new Effect(pcanvas.width, pcanvas.height);
    effect.init(pctx, image, {
      imageScale: 0.5,
      gap: 5,
      particleSize: 4,
    });
    animate();

    const warpButton = document.getElementById('warp-button');

    if (!warpButton) {
      throw new Error('No warp button found');
    }

    warpButton.addEventListener('click', effect.warp);
  });
