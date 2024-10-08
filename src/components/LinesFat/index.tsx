import React, { useEffect, useRef } from 'react'; // 导入 React 库和钩子函数
import * as THREE from 'three'; // 导入 Three.js 库
import Stats from 'three/addons/libs/stats.module.js'; // 导入性能监控库
import { GPUStatsPanel } from 'three/addons/utils/GPUStatsPanel.js'; // 导入 GPU 性能监控面板
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'; // 导入 GUI 库
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // 导入轨道控制器
import { Line2 } from 'three/addons/lines/Line2.js'; // 导入 Line2 类
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'; // 导入 LineMaterial 类
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'; // 导入 LineGeometry 类
import * as GeometryUtils from 'three/addons/utils/GeometryUtils.js'; // 导入几何工具库

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null); // 创建一个引用，用于挂载 Three.js 渲染器

  useEffect(() => {
    let line, renderer, scene, camera, camera2, controls; // 声明全局变量
    let line1;
    let matLine, matLineBasic, matLineDashed;
    let stats, gpuPanel;
    let gui;
    let insetWidth;
    let insetHeight;

    const init = () => {
      renderer = new THREE.WebGLRenderer({ antialias: true }); // 创建渲染器并启用抗锯齿
      renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比
      renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染器大小
      renderer.setClearColor(0x000000, 0.0); // 设置背景色
      renderer.setAnimationLoop(animate); // 设置动画循环
      mountRef.current?.appendChild(renderer.domElement); // 将渲染器的 DOM 元素添加到引用中

      scene = new THREE.Scene(); // 创建场景

      camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        1,
        1000,
      ); // 创建主相机
      camera.position.set(-40, 0, 60); // 设置相机位置

      camera2 = new THREE.PerspectiveCamera(40, 1, 1, 1000); // 创建第二个相机
      camera2.position.copy(camera.position); // 复制主相机的位置

      controls = new OrbitControls(camera, renderer.domElement); // 创建轨道控制器
      controls.enableDamping = true; // 启用阻尼效果
      controls.minDistance = 10; // 设置最小距离
      controls.maxDistance = 500; // 设置最大距离

      const positions: number[] = []; // 定义位置数组
      const colors: number[] = []; // 定义颜色数组

      const points = GeometryUtils.hilbert3D(
        new THREE.Vector3(0, 0, 0),
        20.0,
        1,
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
      ); // 生成 Hilbert 曲线点

      const spline = new THREE.CatmullRomCurve3(points); // 创建样条曲线
      const divisions = Math.round(12 * points.length); // 计算分段数
      const point = new THREE.Vector3(); // 创建点对象
      const color = new THREE.Color(); // 创建颜色对象

      for (let i = 0, l = divisions; i < l; i++) {
        const t = i / l;

        spline.getPoint(t, point); // 获取曲线上的点
        positions.push(point.x, point.y, point.z); // 添加点的位置

        color.setHSL(t, 1.0, 0.5, THREE.SRGBColorSpace); // 设置颜色
        colors.push(color.r, color.g, color.b); // 添加颜色
      }

      const geometry = new LineGeometry(); // 创建线几何体
      geometry.setPositions(positions); // 设置几何体的位置
      geometry.setColors(colors); // 设置几何体的颜色

      matLine = new LineMaterial({
        color: 0xffffff,
        linewidth: 5,
        vertexColors: true,
        dashed: false,
        alphaToCoverage: true,
      }); // 创建线材质

      line = new Line2(geometry, matLine); // 创建 Line2 对象
      line.computeLineDistances(); // 计算线段距离
      line.scale.set(1, 1, 1); // 设置缩放
      scene.add(line); // 将线段添加到场景中

      const geo = new THREE.BufferGeometry(); // 创建缓冲几何体
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3),
      ); // 设置位置属性
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); // 设置颜色属性

      matLineBasic = new THREE.LineBasicMaterial({ vertexColors: true }); // 创建基本线材质
      matLineDashed = new THREE.LineDashedMaterial({
        vertexColors: true,
        scale: 2,
        dashSize: 1,
        gapSize: 1,
      }); // 创建虚线材质

      line1 = new THREE.Line(geo, matLineBasic); // 创建基本线对象
      line1.computeLineDistances(); // 计算线段距离
      line1.visible = false; // 设置不可见
      scene.add(line1); // 将线段添加到场景中

      window.addEventListener('resize', onWindowResize); // 添加窗口大小调整事件监听器
      onWindowResize(); // 初始化窗口大小

      stats = new Stats(); // 创建性能监控对象
      mountRef.current?.appendChild(stats.dom); // 将性能监控的 DOM 元素添加到引用中

      gpuPanel = new GPUStatsPanel(renderer.getContext()); // 创建 GPU 性能监控面板
      stats.addPanel(gpuPanel); // 添加 GPU 性能监控面板
      stats.showPanel(0); // 显示第一个面板

      initGui(); // 初始化 GUI
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight; // 更新相机的宽高比
      camera.updateProjectionMatrix(); // 更新相机的投影矩阵

      renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器大小

      insetWidth = window.innerHeight / 4; // 设置内嵌视口宽度
      insetHeight = window.innerHeight / 4; // 设置内嵌视口高度

      camera2.aspect = insetWidth / insetHeight; // 更新第二个相机的宽高比
      camera2.updateProjectionMatrix(); // 更新第二个相机的投影矩阵
    };

    const animate = () => {
      renderer.setClearColor(0x000000, 0); // 设置背景色
      renderer.setViewport(0, 0, window.innerWidth, window.innerHeight); // 设置视口

      controls.update(); // 更新控制器

      gpuPanel.startQuery(); // 开始 GPU 查询
      renderer.render(scene, camera); // 渲染场景
      gpuPanel.endQuery(); // 结束 GPU 查询

      renderer.setClearColor(0x222222, 1); // 设置背景色
      renderer.clearDepth(); // 清除深度缓存

      renderer.setScissorTest(true); // 启用裁剪测试
      renderer.setScissor(20, 20, insetWidth, insetHeight); // 设置裁剪区域
      renderer.setViewport(20, 20, insetWidth, insetHeight); // 设置视口

      camera2.position.copy(camera.position); // 复制主相机的位置
      camera2.quaternion.copy(camera.quaternion); // 复制主相机的旋转

      renderer.render(scene, camera2); // 渲染内嵌场景

      renderer.setScissorTest(false); // 禁用裁剪测试

      stats.update(); // 更新性能监控
    };

    const initGui = () => {
      gui = new GUI(); // 创建 GUI 对象

      const param = {
        'line type': 0,
        'world units': false,
        width: 5,
        alphaToCoverage: true,
        dashed: false,
        'dash scale': 1,
        'dash / gap': 1,
      }; // 定义 GUI 参数

      gui
        .add(param, 'line type', { LineGeometry: 0, 'gl.LINE': 1 })
        .onChange(function (val) {
          switch (val) {
            case 0:
              line.visible = true; // 显示 Line2 对象
              line1.visible = false; // 隐藏基本线对象
              break;
            case 1:
              line.visible = false; // 隐藏 Line2 对象
              line1.visible = true; // 显示基本线对象
              break;
          }
        });

      gui.add(param, 'world units').onChange(function (val) {
        matLine.worldUnits = val; // 设置是否使用世界单位
        matLine.needsUpdate = true; // 标记材质需要更新
      });

      gui.add(param, 'width', 1, 10).onChange(function (val) {
        matLine.linewidth = val; // 设置线宽
      });

      gui.add(param, 'alphaToCoverage').onChange(function (val) {
        matLine.alphaToCoverage = val; // 设置是否启用 alphaToCoverage
      });

      gui.add(param, 'dashed').onChange(function (val) {
        matLine.dashed = val; // 设置是否虚线
        line1.material = val ? matLineDashed : matLineBasic; // 切换材质
      });

      gui.add(param, 'dash scale', 0.5, 2, 0.1).onChange(function (val) {
        matLine.dashScale = val; // 设置虚线比例
        matLineDashed.scale = val; // 设置虚线比例
      });

      gui
        .add(param, 'dash / gap', { '2 : 1': 0, '1 : 1': 1, '1 : 2': 2 })
        .onChange(function (val) {
          switch (val) {
            case 0:
              matLine.dashSize = 2; // 设置虚线大小
              matLine.gapSize = 1; // 设置间隔大小
              matLineDashed.dashSize = 2; // 设置虚线大小
              matLineDashed.gapSize = 1; // 设置间隔大小
              break;
            case 1:
              matLine.dashSize = 1; // 设置虚线大小
              matLine.gapSize = 1; // 设置间隔大小
              matLineDashed.dashSize = 1; // 设置虚线大小
              matLineDashed.gapSize = 1; // 设置间隔大小
              break;
            case 2:
              matLine.dashSize = 1; // 设置虚线大小
              matLine.gapSize = 2; // 设置间隔大小
              matLineDashed.dashSize = 1; // 设置虚线大小
              matLineDashed.gapSize = 2; // 设置间隔大小
              break;
          }
        });
    };

    init(); // 初始化场景

    return () => {
      window.removeEventListener('resize', onWindowResize); // 移除窗口大小调整事件监听器
      mountRef.current?.removeChild(renderer.domElement); // 移除渲染器的 DOM 元素
      gui.destroy(); // 销毁 GUI
    };
  }, []);

  return <div ref={mountRef} />; // 返回一个引用的 div 元素
};

export default ThreeScene; // 导出 ThreeScene 组件
