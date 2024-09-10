let nodes = {};
export function clearGrid() {
  nodes = {};
}

export function setAt(position, value) {
  nodes["(" + position.x + ", " + position.y + ", " + position.z + ")"] = value;
}

export function getAt(position) {
  return nodes["(" + position.x + ", " + position.y + ", " + position.z + ")"];
}
