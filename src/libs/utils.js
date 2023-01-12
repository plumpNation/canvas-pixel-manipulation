/**
 * Get a typesafe 2d canvas and context.
 * Can be an existing canvas element id in DOM, or
 * pass in a canvas element to simply perform the null
 * and type checking required to know that it is set up
 * correctly.
 *
 * @param {string | HTMLCanvasElement} canvasOrId
 * @param {Object} [options]
 * @param {number} [options.width = window.innerWidth]
 * @param {number} [options.height = window.innerHeight]
 */
const get2DCanvas = (canvasOrId, options) => {
  const canvas = canvasOrId instanceof HTMLCanvasElement
    ? canvasOrId
    : document.getElementById(canvasOrId);

  if (!canvas) {
    throw new Error("canvas was not found");
  }

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new TypeError("element supplied as canvas must be an HTMLCanvasElement");
  }

  canvas.width = options?.width ?? window.innerWidth;
  canvas.height = options?.height ?? window.innerHeight;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error("canvas.context could not be created");
  }

  return { canvas, ctx };
};

/**
 * Create a typesafe 2d canvas and context (in memory).
 *
 * @param {{ width?: number, height?: number }} [options]
 */
const create2DCanvas = (options) => {
  const canvas = document.createElement('canvas');

  return get2DCanvas(canvas, options);
};

/**
 * If we don't use a local source from our own webserver,
 * we will need to use a proxy as drawing a cross origin image
 * onto our canvas makes it dirty (unsafe).
 *
 * @param {string} src A same origin image URL
 * @param {boolean} unsafe Set true for insecure tainted canvas
 * @returns {Promise<HTMLImageElement>}
 */
const loadImage = (src, unsafe = false) => {
  const image = new Image();

  image.crossOrigin = unsafe ? 'Anonymous' : null;

  return new Promise((resolve) => {
    image.onload = () => {
      resolve(image);
    }

    image.src = src;
  });
};

/**
 * A way to turn an image located at a URL into a base64 data url.
 * You _may_ need this to safely load remote images.
 * If you draw a remote image to the canvas, you cannot access
 * it's pixel information. The canvas is considered dirty.
 *
 * @param {string} src
 * @param {boolean} unsafe Set true for insecure tainted canvas
 * @returns {Promise<string>}
 */
const srcURLToDataURL = (src, unsafe = false) => loadImage(src, unsafe).then((image) => {
  const { canvas, ctx } = create2DCanvas();

  canvas.height = image.naturalHeight;
  canvas.width = image.naturalWidth;

  ctx.drawImage(image, 0, 0);

  const dataURL = canvas.toDataURL('image/jpeg');

  return dataURL;
});


/**
 * Takes a file input and reads the file contents, converting
 * them into a base64 string and stripping the `data:` prefix
 * and any chars up to and including the first `,`.
 *
 * @param {HTMLInputElement} input
 * @param {number} index
 * @returns {Promise<string>}
 */
const fileToDataURL = (input, index) => {
  var file = input.files?.[index];

  return new Promise((resolve) => {
    const reader = new FileReader();

    let base64String;

    if (file === undefined) {
      throw new TypeError(`File not found in FileList for input at [${index}]`);
    }

    reader.onload = () => {
      if (!reader.result || typeof reader.result !== 'string') {
        throw new Error(`Not able to read the file ${file?.name}`);
      }

      base64String = reader.result
        .replace('data:', '')
        .replace(/^.+,/, '');

      resolve(base64String);
    }

    reader.readAsDataURL(file);
  });
}