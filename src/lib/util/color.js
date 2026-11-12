define([], function() {
    var colorCache = {};
	var colorCanvas = document.createElement('canvas');
	colorCanvas.width = colorCanvas.height = 1;
	var colorCanvasCtx = colorCanvas.getContext('2d');

	/** @see https://stackoverflow.com/questions/11068240/what-is-the-most-efficient-way-to-parse-a-css-color-in-javascript */
	function colorToRGBA(inputColor) {
		if (inputColor == null || typeof inputColor !== 'string') {
			// If it's an array, we're gonna assume it's an already parsed color
			return Array.isArray(inputColor) ? inputColor : null;
		}
		if (colorCache.hasOwnProperty(inputColor)) {
			var cached = colorCache[inputColor];
			return cached ? cached.slice() : null;
		}

		colorCanvasCtx.clearRect(0, 0, 1, 1);
		// In order to detect invalid values,
		// we can't rely on col being in the same format as what fillStyle is computed as,
		// but we can ask it to implicitly compute a normalized value twice and compare.
		colorCanvasCtx.fillStyle = '#000';
		colorCanvasCtx.fillStyle = inputColor;
		var computed = colorCanvasCtx.fillStyle;
		colorCanvasCtx.fillStyle = '#fff';
		colorCanvasCtx.fillStyle = inputColor;
		if (computed !== colorCanvasCtx.fillStyle) {
			// invalid color
			colorCache[inputColor] = null;
			return null;
		}
		colorCanvasCtx.fillRect(0, 0, 1, 1);

		var outputColor = Array.from(colorCanvasCtx.getImageData(0, 0, 1, 1).data);
		colorCache[inputColor] = outputColor;

		return outputColor.slice();
	}

	function colorToHex(inputColor) {
		var rgba;
		if (Array.isArray(inputColor)) {
			rgba = inputColor;
		} else if (inputColor instanceof Uint8ClampedArray) {
			rgba = Array.from(inputColor);
		} else {
			rgba = colorToRGBA(inputColor);
			if (!rgba) {
				return null;
			}
			rgba = Array.from(rgba);
		}

		return '#' + rgba.map(function (number) {
			return number < 10 ? '0' + number.toString() : number.toString(16);
		}).join('');
	}

	function colorIsSame(one, two) {
		if (!Array.isArray(one) || !Array.isArray(two)) {
			return (one == null && two == null) || one === two;
		}

        return one.every(function(part, idx) {
            return part === two[idx];
        });
    }

    return {
        colorToRGBA: colorToRGBA,
        colorToHex: colorToHex,
		colorIsSame: colorIsSame
    };
});
