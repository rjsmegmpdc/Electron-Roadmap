import React from 'react';
import { TaskManager } from './TaskManager';

export function TaskManagerTest() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Task Manager Test</h1>
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '8px', 
        padding: '16px',
        backgroundColor: '#f9f9f9'
      }}>
        <TaskManager
          projectId="test-project-1"
          onTaskCreated={(task) => {
            console.log('Test: Task created:', task);
            alert(`Task "${task.title}" created successfully!`);
          }}
          onTaskUpdated={(task) => {
            console.log('Test: Task updated:', task);
            alert(`Task "${task.title}" updated successfully!`);
          }}
          onTaskDeleted={(taskId) => {
            console.log('Test: Task deleted:', taskId);
            alert(`Task ${taskId} deleted successfully!`);
          }}
        />
      </div>
    </div>
  );
}