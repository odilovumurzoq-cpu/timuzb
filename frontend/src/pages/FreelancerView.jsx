import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function FreelancerView() {
  const { token } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // In a real app, this would fetch tasks assigned to this freelancer token
    setLoading(false);
  }, [token]);

  if (loading) return <div className="loading">Yuklanmoqda...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="freelancer-portal">
      <div className="portal-header">
        <h2>Frilanser Ish Paneli</h2>
        <p>Sizga biriktirilgan vazifalar</p>
      </div>

      <div className="tasks-grid">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>Hozircha sizga biriktirilgan vazifalar yo'q.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task._id} className="task-card">
              <h3>{task.title}</h3>
              <p><strong>Muddati:</strong> {new Date(task.deadline).toLocaleDateString()}</p>
              <p><strong>Holati:</strong> {task.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FreelancerView;
