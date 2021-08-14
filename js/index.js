// from https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
Math.randomNormal = function() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

document.querySelector('#startButton')?.addEventListener('click', async () => {
	await Tone.start();
})


function KochSynth( options = {} ) {
	this.width = options.width || view.viewSize.width * .75;
	this.levels = options.levels || 1;
	this.tempo = options.tempo || 120;
	this.tonality = options.tonality || Tonality.Major;
	this.view = options.view;
	this.synth = new Tone.Synth().toDestination();
	this.start = this.view.center - [this.width/2, this.view.viewSize.height * -1 / 3];
	this.vector = new Point([this.width, 0]);
	this.lastPath = 0;
	this.currentSegment = 0;
}


// const WIDTH = view.viewSize.width * .75;
// const LEVELS = 5;
// const BPM = 90;



// const start = view.center - [WIDTH/2, view.viewSize.height * -1 / 3];
// const vector = new Point([WIDTH, 0]);
// let currentSegment = 0;

drawKochSegment( start, vector, LEVELS);



startTransport();

function KochSynth.prototype.startTransport = function() {
	Tone.Transport.bpm.value = this.tempo;
	Tone.Transport.scheduleRepeat( this.playSegment, "16n" );
	Tone.Transport.start();
}

function KochSynth.prototype.playSegment = function( time ) {
	let segment = project.activeLayer.children[ this.currentSegment ];
	synth.triggerAttackRelease( tonality.freq( segment.data.pitch ), "16n", time + 0.150 );
	segment.tween( {'strokeColor.alpha': 1}, 100 );
	segment.tween( {"segments[1].point": segment.data.endPoint }, 50 );
	segment.tween( {'strokeWidth': 5}, 250 ).then( function() {
		segment.tween( {'strokeWidth': 1}, 3000 );
	});
	this.currentSegment++;
	if ( this.currentSegment >= project.activeLayer.children.length ) {
		this.currentSegment = 0;
	}
}


function drawKochSegment( startingPoint, vector, level, currentPitch = 0, pitchOffset = 0) {

	if ( level > 0 ) {

		let pointA = startingPoint,
			pointB = pointA + vector / 3,
			pointC = pointB + (vector / 3).rotate(-60),
			pointD = pointC + (vector / 3).rotate(60),
			pointE = pointD + vector / 3;

		drawKochSegment( pointA, pointB - pointA, level-1, currentPitch );
		drawKochSegment( pointB, pointC - pointB, level-1, currentPitch + level + pitchOffset);
		drawKochSegment( pointC, pointD - pointC, level-1, currentPitch - level - pitchOffset);
		drawKochSegment( pointD, pointE - pointD, level-1, currentPitch );

	}
	else {

		var path = new Path.Line({
			from: startingPoint,
			to: startingPoint,
			strokeColor: 'cyan',
			strokeWidth: 1,
			strokeCap: 'round',
			data: { pitch: currentPitch, endPoint: startingPoint + vector }
			// shadowColor: 'cyan',
			// shadowBlur: 8,
		});
		path.strokeColor.alpha = 0;
	}
}


function onFrame( event ) {
	for ( const path of project.activeLayer.children ) {
		path.strokeColor.hue += 0.1;
	}
}



