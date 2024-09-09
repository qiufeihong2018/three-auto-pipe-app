import { shuffleArrayInPlace } from "./util";

const canvas2d = document.getElementById("canvas-2d") as HTMLCanvasElement;
const ctx2d = canvas2d.getContext("2d")!;

let dissolveRects: { x: number; y: number; }[] = [];
let dissolveRectsIndex = -1;
let dissolveRectsPerRow = 50;
let dissolveRectsPerColumn = 50;
let dissolveTransitionSeconds = 2;
let dissolveTransitionFrames = dissolveTransitionSeconds * 60;
let dissolveEndCallback;

/**
 * 
 * @param seconds 清除的时间
 * @param endCallback 清除后的回调
 */
export function dissolve(seconds, endCallback) {
	dissolveRectsPerRow = Math.ceil(window.innerWidth / 20);
	dissolveRectsPerColumn = Math.ceil(window.innerHeight / 20);
  
	dissolveRects = new Array(dissolveRectsPerRow * dissolveRectsPerColumn)
	  .fill(null)
	  .map(function(_null, index) {
		return {
		  x: index % dissolveRectsPerRow,
		  y: Math.floor(index / dissolveRectsPerRow),
		};
	  });
	shuffleArrayInPlace(dissolveRects);
	dissolveRectsIndex = 0;
	dissolveTransitionSeconds = seconds;
	dissolveTransitionFrames = dissolveTransitionSeconds * 60;
	dissolveEndCallback = endCallback;

}
  
function finishDissolve() {
	dissolveEndCallback();
	dissolveRects = [];
	dissolveRectsIndex = -1;
	ctx2d.clearRect(0, 0, canvas2d.width, canvas2d.height);
}


export function runDissolveEffect() {
	if (
		canvas2d.width !== window.innerWidth ||
		canvas2d.height !== window.innerHeight
		) {
			canvas2d.width = window.innerWidth;
			canvas2d.height = window.innerHeight;

			if (dissolveRectsIndex > -1) {
				for ( let i = 0; i < dissolveRectsIndex; i++) {
					const rect = dissolveRects[i];
					// TODO: could precompute rect in screen space, or at least make this clearer with "xIndex"/"yIndex"
					const rectWidth = innerWidth / dissolveRectsPerRow;
					const rectHeight = innerHeight / dissolveRectsPerColumn;
					ctx2d.fillStyle = "black";
					ctx2d.fillRect(
					Math.floor(rect.x * rectWidth),
					Math.floor(rect.y * rectHeight),
					Math.ceil(rectWidth),
					Math.ceil(rectHeight)
					);
				}
			}
			}
			if (dissolveRectsIndex > -1) {
			// TODO: calibrate based on time transition is actually taking
			const rectsAtATime = Math.floor(
				dissolveRects.length / dissolveTransitionFrames
			);
			for (
				let i = 0;
				i < rectsAtATime && dissolveRectsIndex < dissolveRects.length;
				i++
			) {
				const rect = dissolveRects[dissolveRectsIndex];
				// TODO: could precompute rect in screen space, or at least make this clearer with "xIndex"/"yIndex"
				const rectWidth = innerWidth / dissolveRectsPerRow;
				const rectHeight = innerHeight / dissolveRectsPerColumn;
				ctx2d.fillStyle = "black";
				ctx2d.fillRect(
				Math.floor(rect.x * rectWidth),
				Math.floor(rect.y * rectHeight),
				Math.ceil(rectWidth),
				Math.ceil(rectHeight)
				);
				dissolveRectsIndex += 1;
			}
			if (dissolveRectsIndex === dissolveRects.length) {
				finishDissolve();
			}
		}
}
