import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let gui;

export function initGui(options) {
	gui = new GUI();
	const param = {
		'joint type': 'elbow',
	}
	// 全屏展示
	gui.add({ 'button': () => {
		const canvasContainer = document.getElementById("canvas-container") as HTMLCanvasElement;
		if (canvasContainer.requestFullscreen) {
			canvasContainer.requestFullscreen();
		  }
	} }, 'button').name('全屏展示');
	
	// 重新绘制
	gui.add({ 'button': () => {
		options.clear()
	} }, 'button').name('重新绘制');
	
	// 输出管道数据
	gui.add({ 'button': () => {
		options.printPipesInfo()
	} }, 'button').name('管道数据');

	// 切换关节类型
	gui.add(param, 'joint type', { 'Elbow': 'elbow', 'Ball': 'ball', 'Teapot': 'teapot' }).onChange(function (val) {
		options.setJointType(val)
	}).name('关节类型');


}