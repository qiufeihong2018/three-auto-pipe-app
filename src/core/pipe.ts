
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

export const Pipe = function(scene, options) {
  const self = this;
  const pipeRadius = 0.2;
  const ballJointRadius = pipeRadius * 1.5;
  const teapotSize = ballJointRadius;

  self.currentPosition = randomIntegerVector3WithinBox(gridBounds);
  self.positions = [self.currentPosition];
  self.object3d = new THREE.Object3D();
  scene.add(self.object3d);
  if (options.texturePath) {
    self.material = new THREE.MeshLambertMaterial({
      map: textures[options.texturePath],
    });
  } else {
    const color = randomInteger(0, 0xffffff);
    const emissive = new THREE.Color(color).multiplyScalar(0.3);
    self.material = new THREE.MeshPhongMaterial({
      specular: 0xa9fcff,
      color: color,
      emissive: emissive,
      shininess: 100,
    });
  }
  const makeCylinderBetweenPoints = function(fromPoint, toPoint, material) {
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

    self.object3d.add(mesh);
  };
  const makeBallJoint = function(position) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(ballJointRadius, 8, 8),
      self.material
    );
    ball.position.copy(position);
    self.object3d.add(ball);
  };
  const makeTeapotJoint = function(position) {
    const teapot = new THREE.Mesh(
      // 
      new TeapotGeometry(teapotSize, 10, true, true, true, true),
      self.material
      //new THREE.MeshLambertMaterial({ map: teapotTexture })
    );
    teapot.position.copy(position);
    teapot.rotation.x = (Math.floor(random(0, 50)) * Math.PI) / 2;
    teapot.rotation.y = (Math.floor(random(0, 50)) * Math.PI) / 2;
    teapot.rotation.z = (Math.floor(random(0, 50)) * Math.PI) / 2;
    self.object3d.add(teapot);
  };
  const makeElbowJoint = function(fromPosition) {
    // "elball" (not a proper elbow)
    const elball = new THREE.Mesh(
      new THREE.SphereGeometry(pipeRadius, 8, 8),
      self.material
    );
    elball.position.copy(fromPosition);
    self.object3d.add(elball);
  };

  setAt(self.currentPosition, self);

  makeBallJoint(self.currentPosition);

  self.update = function() {
    let directionVector;
    let lastDirectionVector;
    if (self.positions.length > 1) {
      const lastPosition = self.positions[self.positions.length - 2];
      lastDirectionVector = new THREE.Vector3().subVectors(
        self.currentPosition,
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
      self.currentPosition,
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
    setAt(newPosition, self);

    // joint
    // (initial ball joint is handled elsewhere)
    if (lastDirectionVector && !lastDirectionVector.equals(directionVector)) {
      if (chance(options.teapotChance)) {
        makeTeapotJoint(self.currentPosition);
      } else if (chance(options.ballJointChance)) {
        makeBallJoint(self.currentPosition);
      } else {
        makeElbowJoint(self.currentPosition);
      }
    }

    // pipe
    makeCylinderBetweenPoints(self.currentPosition, newPosition, self.material);

    // update
    self.currentPosition = newPosition;
    self.positions.push(newPosition);
  };
};
