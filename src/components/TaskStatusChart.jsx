const TaskStatusChart = ({ data }) => {
  const total = data.Todo + data["In Progress"] + data.Done;

  const getPercentage = (value) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <div className="task-status-chart">
      <div className="chart-stat">
        <div className="chart-stat-header">
          <span>Todo</span>
          <strong>{data.Todo}</strong>
        </div>

        <div className="chart-bar">
          <div
            className="chart-fill todo"
            style={{ width: `${getPercentage(data.Todo)}%` }}
          />
        </div>

        <small>{getPercentage(data.Todo)}%</small>
      </div>

      <div className="chart-stat">
        <div className="chart-stat-header">
          <span>In Progress</span>
          <strong>{data["In Progress"]}</strong>
        </div>

        <div className="chart-bar">
          <div
            className="chart-fill progress"
            style={{
              width: `${getPercentage(data["In Progress"])}%`,
            }}
          />
        </div>

        <small>{getPercentage(data["In Progress"])}%</small>
      </div>

      <div className="chart-stat">
        <div className="chart-stat-header">
          <span>Done</span>
          <strong>{data.Done}</strong>
        </div>

        <div className="chart-bar">
          <div
            className="chart-fill done"
            style={{ width: `${getPercentage(data.Done)}%` }}
          />
        </div>

        <small>{getPercentage(data.Done)}%</small>
      </div>
    </div>
  );
};

export default TaskStatusChart;