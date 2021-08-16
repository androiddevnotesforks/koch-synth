// from https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
Math.randomNormal = function() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

// document.querySelector('#playPauseButton')?.addEventListener('click', async () => {
// 	await Tone.start();
// })


function KochSynth( options = {} ) {
	this.width = options.width || view.viewSize.width * .75;
	this.levels = options.levels || 3;
	this.tempo = options.tempo || 120;
	this.tonality = options.tonality || Tonality.Major;
	this.tonic = options.tonic || Tonality.MIDDLEC;
	this.offset = options.offset || 0;
	this.view = options.view;
	this.synth = new Tone.Synth().toDestination();
	this.startingPoint = this.view.center - [this.width/2, this.view.viewSize.height * -1 / 3];
	this.vector = new Point([this.width, 0]);
	this.lastPath = 0;
	this.currentSegment = 0;
	this.playing = false;
	this.initialized = false;
}

KochSynth.prototype.setTempo = function( tempo ) {
	this.tempo = tempo;
	Tone.Transport.bpm.value = this.tempo;
}

KochSynth.prototype.setTonic = function( tonic ) {
	this.tonality.setTonic( tonic );
}

KochSynth.prototype.setTonality = function( tonality ) {
	switch( tonality ) {
		case 'Major':
			this.tonality = Tonality.Major.setTonic( this.tonic );
			break;
		case 'Minor':
			this.tonality = Tonality.Minor.setTonic( this.tonic );
			break;
		case 'Pentatonic':
			this.tonality = Tonality.Pentatonic.setTonic( this.tonic );
			break;
		case 'MinorPentatonic':
			this.tonality = Tonality.MinorPentatonic.setTonic( this.tonic );
			break;
		case 'Phreygish':
			this.tonality = Tonality.Phreygish.setTonic( this.tonic );
			break;
	}
}

KochSynth.prototype.setOffset = function( offset ) {
	this.offset = offset;
	this.reset();
}

KochSynth.prototype.setLevels = function( levels ) {
	this.levels = levels;
	this.reset();
}


KochSynth.prototype.start = function() {
	if ( this.initialized == false ) {
		this.initialized = true;
		Tone.Transport.bpm.value = this.tempo;
		Tone.Transport.scheduleRepeat( this.playSegment.bind( this ), "16n" );
	}
	Tone.Transport.start();
}

KochSynth.prototype.stop = function() {
	Tone.Transport.stop();
}

KochSynth.prototype.reset = function() {
	project.activeLayer.removeChildren()
	this.currentSegment = 0;
	this.drawKochSegment();
}

KochSynth.prototype.playSegment = function( time ) {
	let segment = project.activeLayer.children[ this.currentSegment ];
	this.synth.triggerAttackRelease( this.tonality.freq( segment.data.pitch ), "16n", time + 0.150 );

	document.getElementById( 'debug' ).innerText = Tone.Frequency( this.tonality.pitch( segment.data.pitch ), "midi" ).toNote();
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


KochSynth.prototype.drawKochSegment = function( startingPoint = this.startingPoint, vector = this.vector, level = this.levels, currentPitch = 0, pitchOffset = this.offset) {

	if ( level > 0 ) {

		let pointA = startingPoint,
			pointB = pointA + vector / 3,
			pointC = pointB + (vector / 3).rotate(-60),
			pointD = pointC + (vector / 3).rotate(60),
			pointE = pointD + vector / 3;

		this.drawKochSegment( pointA, pointB - pointA, level-1, currentPitch );
		this.drawKochSegment( pointB, pointC - pointB, level-1, currentPitch + level + pitchOffset);
		this.drawKochSegment( pointC, pointD - pointC, level-1, currentPitch - level - pitchOffset);
		this.drawKochSegment( pointD, pointE - pointD, level-1, currentPitch );

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

/* Animate the hue */
function onFrame( event ) {
	for ( const path of project.activeLayer.children ) {
		path.strokeColor.hue += 0.1;
	}
}

const koch = new KochSynth( {
	view: view
});

koch.drawKochSegment();


document.querySelector('#playPauseButton').addEventListener('click',  (event) => {
	if ( koch.playing ) {
		koch.playing = false;
		koch.stop();
		event.target.innerText = 'play';
	}
	else {
		koch.playing = true;
		koch.start();
		event.target.innerText = 'stop';
	}

});

document.getElementById( 'playPauseButton' ).addEventListener( 'keydown', (event) => {
	event.stopPropagation();
});

document.addEventListener( 'keydown', (e) => {
	if (e.keyCode == 32) {
		if ( koch.playing ) {
			koch.playing = false;
			koch.stop();
			document.getElementById( 'playPauseButton' ).innerText = 'play';
		}
		else {
			koch.playing = true;
			koch.start();
			document.getElementById( 'playPauseButton' ).innerText = 'stop';
		}

	}
});


document.querySelector( '#tempo' ).addEventListener( 'change', (event) => {
	koch.setTempo( event.target.value );
});

document.querySelector( '#tonic' ).addEventListener( 'change', (event) => {
	koch.setTonic( Number( event.target.value ) );
});

document.querySelector( '#tonality' ).addEventListener( 'change', (event) => {
	koch.setTonality( event.target.value );
});

document.querySelector( '#levels' ).addEventListener( 'change', (event) => {
	koch.setLevels( Number( event.target.value ) );
});

document.querySelector( '#offset' ).addEventListener( 'change', (event) => {
	koch.setOffset( Number( event.target.value ) );
});

document.querySelectorAll( 'input' ).forEach( (el) => {

	el.addEventListener( 'keydown' , (e) => {
		if (e.keyCode == 38 ) {
		  	e.target.value = Number( e.target.value ) + 1;
		  	e.target.dispatchEvent( new CustomEvent( 'change' ) );
  		}
		if (e.keyCode == 40 ) {
  			e.target.value = Number( e.target.value ) - 1;
		  	e.target.dispatchEvent( new CustomEvent( 'change' ) );
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




