// from https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
Math.randomNormal = function () {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// document.querySelector('#playPauseButton')?.addEventListener('click', async () => {
// 	await Tone.start();
// })

function KochSynth(options = {}) {
  this.width = options.width || view.viewSize.width * 0.75;
  this.levels = options.levels || 3;
  this.tempo = Number( options.tempo ) || 120;
  this.tonality = options.tonality || Tonality.Major;
  this.tonic = Number( options.tonic ) || Tonality.MIDDLEC;
  this.offset = Number( options.offset ) || 0;
  this.randomizeVelocity = Number( options.randomizeVelocity ) || 0;
  this.view = options.view;
  this.synth = new Tone.Synth().toDestination();
  this.startingPoint =
    this.view.center - [this.width / 2, (this.view.viewSize.height * -1) / 3];
  this.vector = new Point([this.width, 0]);
  this.lastPath = 0;
  this.currentSegment = 0;
  this.playing = false;
  this.initialized = false;

  if ( typeof this.tonality === "string" ) {
	  this.tonality = Tonality[this.tonality];
  }
  this.tonality = this.tonality.setTonic( this.tonic);
}

KochSynth.VELOCITY_QUANTIZE = 4;
KochSynth.MAX_STROKE_WIDTH = 10;
KochSynth.MIN_STROKE_WIDTH = 2;

KochSynth.prototype.setTempo = function (tempo) {
  this.tempo = tempo;
  Tone.Transport.bpm.value = this.tempo;
};

KochSynth.prototype.setTonic = function (tonic) {
  this.tonality.setTonic(tonic);
};

KochSynth.prototype.setTonality = function (tonality) {
  switch (tonality) {
    case "Major":
      this.tonality = Tonality.Major.setTonic(this.tonic);
      break;
    case "Minor":
      this.tonality = Tonality.Minor.setTonic(this.tonic);
      break;
    case "Pentatonic":
      this.tonality = Tonality.Pentatonic.setTonic(this.tonic);
      break;
    case "MinorPentatonic":
      this.tonality = Tonality.MinorPentatonic.setTonic(this.tonic);
      break;
    case "Phreygish":
      this.tonality = Tonality.Phreygish.setTonic(this.tonic);
      break;
  }
};

KochSynth.prototype.setOffset = function (offset) {
  this.offset = offset;
  this.reset();
};

KochSynth.prototype.setLevels = function (levels) {
  this.levels = levels;
  this.reset();
};

KochSynth.prototype.setRandomizeVelocity = function (randomizeVelocity) {
  this.randomizeVelocity = randomizeVelocity;
};

KochSynth.prototype.start = function () {
  if (!this.initialized) {
    this.initialized = true;
    Tone.Transport.bpm.value = this.tempo;
    Tone.Transport.scheduleRepeat(this.playSegment.bind(this), "16n");
    Tone.start();
  }
  Tone.Transport.start();
};

KochSynth.prototype.stop = function () {
  Tone.Transport.stop();
};

KochSynth.prototype.reset = function () {
  project.activeLayer.removeChildren();
  this.currentSegment = 0;
  this.drawKochSegment();
};

KochSynth.prototype.playSegment = function (time) {
  let segment = project.activeLayer.children[this.currentSegment];

  // At randomizeVelocity == 0, velocity will always be 1
  // At randomizeVelocity == 0.5, velocity will respect a uniform distribution between 0 and 1
  // At randomizeVelocity == 1.0, velocity will respect a parabolic distribution with 0 being more likely than 1
  const velocity =
    Math.floor(
      Math.pow(Math.random(), 2 * this.randomizeVelocity) *
        KochSynth.VELOCITY_QUANTIZE
    ) / KochSynth.VELOCITY_QUANTIZE;

  this.synth.triggerAttackRelease(
    this.tonality.freq(segment.data.pitch),
    "16n",
    time + 0.15,
    velocity
  );

  document.getElementById("debug").innerText = `${Tone.Frequency(
    this.tonality.pitch(segment.data.pitch),
    "midi"
  ).toNote()} ${velocity}`;
  segment.tween({ "strokeColor.alpha": 1 }, 100);
  segment.tween({ "segments[1].point": segment.data.endPoint }, 50);
  segment
    .tween({ strokeWidth: KochSynth.MAX_STROKE_WIDTH * velocity }, 250)
    .then(function () {
      segment.tween({ strokeWidth: KochSynth.MIN_STROKE_WIDTH }, 3000);
    });
  this.currentSegment++;
  if (this.currentSegment >= project.activeLayer.children.length) {
    this.currentSegment = 0;
  }
};

KochSynth.prototype.drawKochSegment = function (
  startingPoint = this.startingPoint,
  vector = this.vector,
  level = this.levels,
  currentPitch = 0,
  pitchOffset = this.offset
) {
  if (level > 0) {
    let pointA = startingPoint,
      pointB = pointA + vector / 3,
      pointC = pointB + (vector / 3).rotate(-60),
      pointD = pointC + (vector / 3).rotate(60),
      pointE = pointD + vector / 3;

    this.drawKochSegment(pointA, pointB - pointA, level - 1, currentPitch);
    this.drawKochSegment(
      pointB,
      pointC - pointB,
      level - 1,
      currentPitch + level + pitchOffset
    );
    this.drawKochSegment(
      pointC,
      pointD - pointC,
      level - 1,
      currentPitch - level - pitchOffset
    );
    this.drawKochSegment(pointD, pointE - pointD, level - 1, currentPitch);
  } else {
    var path = new Path.Line({
      from: startingPoint,
      to: startingPoint,
      strokeColor: "cyan",
      strokeWidth: 1,
      strokeCap: "round",
      data: { pitch: currentPitch, endPoint: startingPoint + vector },
      // shadowColor: 'cyan',
      // shadowBlur: 8,
    });
    path.strokeColor.alpha = 0;
  }
};

/* Animate the hue */
function onFrame(event) {
  for (const path of project.activeLayer.children) {
    path.strokeColor.hue += 0.1;
  }
}

/* Get query params from URL */
const options = window.location.search
  .substring(1)
  .split("&")
  .reduce((pendingOptions, param) => {
    const [key, value] = param.split("=");
    return { [key]: value, ...pendingOptions };
  }, {});

/* Initialize UI controls based on params */
for (const option in options) {
  if (option) {
    document.querySelector(`#${option}`).value = options[option];
  }
}

const updateURLParams = (params) => {
	const search = [];
	for (const key in params) {
			options[key] = params[key]
	}
	for (const key in options ) {
		if ( key )
			search.push( `${key}=${options[key]}`);
	}			
	window.location.search = search.join("&");
};

const koch = new KochSynth({
  view: view,
  ...options,
});

koch.drawKochSegment();

/* Transport actions */

document
  .querySelector("#playPauseButton")
  .addEventListener("click", (event) => {
    if (koch.playing) {
      koch.playing = false;
      koch.stop();
      event.target.innerText = "play";
    } else {
      koch.playing = true;
      koch.start();
      event.target.innerText = "stop";
    }
  });

document
  .getElementById("playPauseButton")
  .addEventListener("keydown", (event) => {
    event.stopPropagation();
  });

document.addEventListener("keydown", (e) => {
  if (e.keyCode == 32) {
    if (koch.playing) {
      koch.playing = false;
      koch.stop();
      document.getElementById("playPauseButton").innerText = "play";
    } else {
      koch.playing = true;
      koch.start();
      document.getElementById("playPauseButton").innerText = "stop";
    }
  }
});

/* Parameters actions */

document.querySelector("#tempo").addEventListener("change", (event) => {
  let tempo = Math.floor(Number(event.target.value));
  if (tempo < 1) tempo = 1;
  if (tempo > 480) tempo = 480;
  koch.setTempo(tempo);
  event.target.value = tempo;
  updateURLParams({ tempo: tempo });
});

document.querySelector("#tonic").addEventListener("change", (event) => {
  koch.setTonic(Number(event.target.value));
  updateURLParams({ tonic: event.target.value });
});

document.querySelector("#tonality").addEventListener("change", (event) => {
  koch.setTonality(event.target.value);
  updateURLParams({ tonality: event.target.value });
});

document.querySelector("#levels").addEventListener("change", (event) => {
  let levels = Math.floor(Number(event.target.value));
  if (levels < 0) levels = 0;
  if (levels > 8) levels = 8;
  koch.setLevels(levels);
  event.target.value = levels;
  updateURLParams({ levels: levels });
});

document.querySelector("#offset").addEventListener("change", (event) => {
  koch.setOffset(Number(event.target.value));
  updateURLParams({ offset: event.target.value });
});

document
  .querySelector("#randomizeVelocity")
  .addEventListener("change", (event) => {
    koch.setRandomizeVelocity(Number(event.target.value));
    updateURLParams({ randomizeVelocity: event.target.value });
  });

/* Keyboard navigation for text inputs */

document.querySelectorAll("input").forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.keyCode == 38) {
      e.target.value = Number(e.target.value) + 1;
      e.target.dispatchEvent(new CustomEvent("change"));
    }
    if (e.keyCode == 40) {
      e.target.value = Number(e.target.value) - 1;
      e.target.dispatchEvent(new CustomEvent("change"));
    }
    if (e.keyCode == 32) {
      e.preventDefault();
    }
  });
});

/* Keyboard navigation for selects */

document.querySelectorAll("select").forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.keyCode == 32) {
      e.preventDefault();
    }
  });
});

// ####        ##       ####     ####   #####
// ####       ####      ####      #### ####
// ####        ##       ####       #######
// ####                 ####        ####
// ####       ####      ####        ####
// ####       ####      ####        ####
// ########   ####      #########   ####
// ########   ####      #########   ####
