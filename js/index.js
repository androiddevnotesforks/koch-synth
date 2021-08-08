const WIDTH = view.viewSize.width * .75;
const LEVELS = 4;
const BPM = 180;


const majorScale = [0, 2, 4, 5, 7, 9, 11];

const synth = new Tone.Synth().toDestination();
let lastPath = 0;

const start = view.center - [WIDTH/2, 0];
const vector = new Point([WIDTH, 0]);
let currentSegment = 0;

drawKochSegment( start, vector, LEVELS);

document.querySelector('#startButton')?.addEventListener('click', async () => {
	await Tone.start()
	console.log('audio is ready')
})


startTransport();

function startTransport() {
	Tone.Transport.bpm.value = BPM;
	Tone.Transport.scheduleRepeat( playSegment, "16n" );
	Tone.Transport.start();
}

function playSegment( time ) {
	let segment = project.activeLayer.children[ currentSegment ];
	synth.triggerAttackRelease( Tone.Midi( segment.data.pitch ).toFrequency(), "16n", time + 0.150 );
	segment.tween( {'strokeColor.alpha': 1}, 100 );
	segment.tween( {"segments[1].point": segment.data.endPoint }, 300 );
	segment.tween( {'strokeWidth': 5}, 250 ).then( function() {
		segment.tween( {'strokeWidth': 1}, 3000 );
	});
	currentSegment++;
	if ( currentSegment >= project.activeLayer.children.length ) {
		currentSegment = 0;
	}
}

// from https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
Math.randomNormal = function() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function drawKochSegment( startingPoint, vector, level, currentPitch = 64) {

	if ( level > 0 ) {

		let pointA = startingPoint,
			pointB = pointA + vector / 3,
			pointC = pointB + (vector / 3).rotate(-60),
			pointD = pointC + (vector / 3).rotate( 60 ),
			pointE = pointD + vector / 3;

		// pointC += new Point( Math.randomNormal() * 3 , Math.randomNormal() * 3 );

		drawKochSegment( pointA, pointB - pointA, level-1, currentPitch );
		drawKochSegment( pointB, pointC - pointB, level-1, currentPitch + level );
		drawKochSegment( pointC, pointD - pointC, level-1, currentPitch - level);
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
		//console.log( currentPitch );
		// path.shadowColor.alpha = 0;

		// // var t = new Tween( path, {strokeWidth: 1}, {strokeWidth: 5}, 1000 );

		// path.tween( {rotation: 0}, {rotation: 45}, {easing: 'easeInOutCubic', duration: 1000} );
	}
}


function onFrame( event ) {
	for ( const path of project.activeLayer.children ) {
		path.strokeColor.hue += 0.1;
	}
}

/*
function onFrame( event ) {
	for ( const path of project.activeLayer.children ) {
		path.strokeColor.hue += 0.1;
		// path.shadowColor.hue += 0.1;
		if ( path.strokeWidth > 1) { 
			path.strokeWidth -= 0.025;
 		}
		// if ( path.shadowColor.alpha > 0.5 ) {
		// 	path.shadowColor.alpha -= 0.001;
		// }
		if ( path.strokeColor.alpha > 0.5 ) {
			path.strokeColor.alpha -= 0.001;
		}
	}


	const currentPath = Math.floor( event.time * 12) % project.activeLayer.children.length;

	// if ( currentPath == 0 ) {
	// 	lastPath = 0;
	// }

	if ( currentPath > lastPath ) {

		//play a middle 'C' for the duration of an 8th note
		// synth.triggerAttackRelease( project.activeLayer.children[ currentPath ].data.pitch, "8n", Tone.now() + currentPath);
		lastPath = currentPath;
	}


	project.activeLayer.children[ currentPath ].strokeWidth += 1;
	if ( project.activeLayer.children[ currentPath ].strokeColor.alpha < 1) {
		project.activeLayer.children[ currentPath ].strokeColor.alpha += 0.3;
	}
	// if ( project.activeLayer.children[ currentPath ].shadowColor.alpha < 1) {
	// 	project.activeLayer.children[ currentPath ].shadowColor.alpha += 0.1;
	// }

}
*/

// function onMouseMove( event ) {
// 	for ( const path of project.activeLayer.children ) {
// 		// path.strokeColor.hue = event.point.x / view.viewSize.width * 360;
// 		// path.shadowColor.hue = event.point.x / view.viewSize.width * 360;
// 		path.strokeWidth += (view.center.y - event.point.y) / view.viewSize.height;
// 	}



// }




