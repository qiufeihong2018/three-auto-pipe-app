import './index.css';

function Tips() {
  return (
    <div className="controls ui-container">
      <table>
        <thead>
          <tr>
            <th>Mouse Button</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr className="orbit-controls-enabled">
            <td>鼠标左键 (拖拽)</td>
            <td>旋转视图</td>
          </tr>
          <tr className="orbit-controls-enabled">
            <td>鼠标右键 (拖拽)</td>
            <td>平移视图</td>
          </tr>
          <tr className="orbit-controls-enabled">
            <td>鼠标中间 (拖拽 or 滚动)</td>
            <td>缩放视图</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Tips;
