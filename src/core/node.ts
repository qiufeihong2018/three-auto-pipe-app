let nodes = {}; // 定义一个空对象，用于存储节点

export function clearGrid() {
  nodes = {}; // 清空节点对象
}

export function setAt(position, value) {
  // 将节点存储在对象中，键为节点的位置，值为节点的值
  nodes["(" + position.x + ", " + position.y + ", " + position.z + ")"] = value;
}

export function getAt(position) {
  // 根据位置从对象中获取节点的值
  return nodes["(" + position.x + ", " + position.y + ", " + position.z + ")"];
}