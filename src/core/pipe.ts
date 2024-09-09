
import * as THREE from 'three';
import { TeapotGeometry } from "three/addons/geometries/TeapotGeometry.js";
import { chance, chooseFrom, random, randomInteger, randomIntegerVector3WithinBox } from './util';
import { textures } from './textures';
import { getAt, setAt } from './node';

// 三维空间中的一个轴对齐包围盒
const gridBounds = new THREE.Box3(
  new THREE.Vector3(-10, -10, -10),
  new THREE.Vector3(10, 10, 10)
);

const pipeRadius = 0.2;
const ballJointRadius = pipeRadius * 1.5;
const teapotSize = ballJointRadius;

export class Pipe {
  public currentPosition;
  public positions;
  public object3d: THREE.Object3D;
  public material;
  public options;

  constructor(scene, options) {
    this.options = options;
  
    this.currentPosition = randomIntegerVector3WithinBox(gridBounds);
    this.positions = [this.currentPosition];
    this.object3d = new THREE.Object3D();
    scene.add(this.object3d);

    if (options.texturePath) {
      this.material = new THREE.MeshLambertMaterial({
        map: textures[options.texturePath],
      });
    } else {
      const color = randomInteger(0, 0xffffff);
      const emissive = new THREE.Color(color).multiplyScalar(0.3);
      this.material = new THREE.MeshPhongMaterial({
        specular: 0xa9fcff,
        color: color,
        emissive: emissive,
        shininess: 100,
      });
    }

  
    setAt(this.currentPosition, this);
  
    this.makeBallJoint(this.currentPosition);
  }

  public makeBallJoint(position) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(ballJointRadius, 8, 8),
      this.material
    );
    ball.position.copy(position);
    this.object3d.add(ball);
  };

  public makeCylinderBetweenPoints(fromPoint, toPoint, material) {
    const deltaVector = new THREE.Vector3().subVectors(toPoint, fromPoint);
    const arrow = new THREE.ArrowHelper(
      deltaVector.clone().normalize(),
      fromPoint
    );
    const geometry = new THREE.CylinderGeometry(
      pipeRadius,
      pipeRadius,
      deltaVector.length(),
      10,
      4,
      true
    );
    const mesh = new THREE.Mesh(geometry, material);

    mesh.rotation.setFromQuaternion(arrow.quaternion);
    mesh.position.addVectors(fromPoint, deltaVector.multiplyScalar(0.5));
    mesh.updateMatrix();

    this.object3d.add(mesh);
  };

  public makeTeapotJoint (position) {
    const teapot = new THREE.Mesh(
      new TeapotGeometry(teapotSize, 10, true, true, true, true),
      this.material
      //new THREE.MeshLambertMaterial({ map: teapotTexture })
    );
    teapot.position.copy(position);
    teapot.rotation.x = (Math.floor(random(0, 50)) * Math.PI) / 2;
    teapot.rotation.y = (Math.floor(random(0, 50)) * Math.PI) / 2;
    teapot.rotation.z = (Math.floor(random(0, 50)) * Math.PI) / 2;
    this.object3d.add(teapot);
  };

  public makeElbowJoint(fromPosition) {
    // "elball" (not a proper elbow)
    const elball = new THREE.Mesh(
      new THREE.SphereGeometry(pipeRadius, 8, 8),
      this.material
    );
    elball.position.copy(fromPosition);
    this.object3d.add(elball);
  };

  public update() {
 


    let directionVector;
    let lastDirectionVector;
    if (this.positions.length > 1) {
      const lastPosition = this.positions[this.positions.length - 2];
      lastDirectionVector = new THREE.Vector3().subVectors(
        this.currentPosition,
        lastPosition
      );
    }
    if (chance(1 / 2) && lastDirectionVector) {
      directionVector = lastDirectionVector;
    } else {
      directionVector = new THREE.Vector3();
      directionVector[chooseFrom("xyz")] += chooseFrom([+1, -1]);
    }
    const newPosition = new THREE.Vector3().addVectors(
      this.currentPosition,
      directionVector
    );

    // last 和 new 的点的位置

    // TODO: try other possibilities
    // ideally, have a pool of the 6 possible directions and try them in random order, removing them from the bag
    // (and if there's truly nowhere to go, maybe make a ball joint)
    if (!gridBounds.containsPoint(newPosition)) {
      return;
    }
    if (getAt(newPosition)) {
      return;
    }
    setAt(newPosition, this);

    // joint
    // (initial ball joint is handled elsewhere)
    if (lastDirectionVector && !lastDirectionVector.equals(directionVector)) {
      if (chance(this.options.teapotChance)) {
        this.makeTeapotJoint(this.currentPosition);
      } else if (chance(this.options.ballJointChance)) {
        this.makeBallJoint(this.currentPosition);
      } else {
        this.makeElbowJoint(this.currentPosition);
      }
    }

    // pipe
    this.makeCylinderBetweenPoints(this.currentPosition, newPosition, this.material);

    // update
    this.currentPosition = newPosition;
    this.positions.push(newPosition);
  };
}
