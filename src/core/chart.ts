import { Chart } from '@antv/g2';

export function createChart(panelDiv: HTMLDivElement): void {
  fetch('https://gw.alipayobjects.com/os/bmw-prod/fbe4a8c1-ce04-4ba3-912a-0b26d6965333.json')
    .then((res) => res.json())
    .then((data) => {
      const chart = new Chart({
        container: panelDiv,
        width: 400,
        height: 200,
      });

      const keyframe = chart
        .timingKeyframe()
        .attr('direction', 'alternate')
        .attr('iterationCount', 4);

      keyframe
        .interval()
        .data(data)
        .transform({ type: 'groupX', y: 'mean' })
        .encode('x', 'gender')
        .encode('y', 'weight')
        .encode('color', 'gender')
        .encode('key', 'gender');

      keyframe
        .point()
        .data(data)
        .encode('x', 'height')
        .encode('y', 'weight')
        .encode('color', 'gender')
        .encode('groupKey', 'gender')
        .encode('shape', 'point');

      chart.render();
    })
    .catch((error) => console.error('Error loading chart data:', error));
}