
# Guide to Using Mock Data for Frontend Development

This guide explains how to use the `mock-db.json` file to simulate a backend for the task management feature. This allows for rapid UI development and testing without a live database connection.

**Note:** All changes made using these methods are in-memory only and **will not persist** after a page refresh. This is intentional for development purposes.

## 1. Setting Up the In-Memory Store

First, you'll need to load the mock data into your application's state. This is typically done in a top-level component or a React Context provider.

```typescript
// Example: In a main component or context
import mockData from './mock-db.json';
import { useState } from 'react';

function TaskFeatureProvider({ children }) {
  const [db, setDb] = useState(mockData);

  // You will pass `db` and functions to update it (like `setDb`) down to your components.
  // ... rest of the provider logic
}
```

## 2. Conceptual CRUD Operations

Here are conceptual examples of how to perform Create, Read, Update, and Delete operations on the `db` state object.

**Important:** For generating new unique IDs in a real application, a library like `uuid` is recommended. For this mock setup, a simple function is sufficient.

```typescript
// Helper for generating simple unique IDs
const generateId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
```

### Read Operations

Reading data involves filtering the arrays in the `db` state.

**Get all tasks for a specific board:**
```typescript
const boardId = 'board-1';
const tasksForBoard = db.tasks.filter(task => task.boardId === boardId);
console.log(tasksForBoard);
```

**Get all tasks assigned to a specific user:**
```typescript
const userId = 'user-4';
const tasksForUser = db.tasks.filter(task => task.assignedToId === userId);
console.log(tasksForUser);
```

**Get a single task by its ID:**
```typescript
const taskId = 'task-1';
const specificTask = db.tasks.find(task => task.id === taskId);
console.log(specificTask);
```

**Get all boards a user is a member of:**
```typescript
const userId = 'user-2';
const boardsForUser = db.boards.filter(board => board.memberIds.includes(userId));
console.log(boardsForUser);
```

### Create Operations

Creating involves adding a new object to the appropriate array in the `db` state.

**Add a new task:**
```typescript
const handleCreateTask = (newTaskData) => {
  const newTask = {
    ...newTaskData,
    id: generateId('task'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [],
  };

  setDb(currentDb => ({
    ...currentDb,
    tasks: [...currentDb.tasks, newTask],
  }));
};

// Usage:
handleCreateTask({
  title: 'My New Awesome Task',
  status: 'to-do',
  boardId: 'board-1',
  priority: 'medium',
  // other fields...
});
```

**Add a new comment to an existing task:**
```typescript
const handleAddComment = (taskId, commentText, userId) => {
  const newComment = {
    id: generateId('comment'),
    userId: userId,
    text: commentText,
    timestamp: new Date().toISOString(),
  };

  setDb(currentDb => ({
    ...currentDb,
    tasks: currentDb.tasks.map(task => 
      task.id === taskId 
        ? { ...task, comments: [...task.comments, newComment] }
        : task
    ),
  }));
};

// Usage:
handleAddComment('task-1', 'This is a new comment!', 'user-2');
```

### Update Operations

Updating involves finding an item in an array and replacing it with a modified version.

**Update a task's status:**
```typescript
const handleUpdateTaskStatus = (taskId, newStatus) => {
  setDb(currentDb => ({
    ...currentDb,
    tasks: currentDb.tasks.map(task =>
      task.id === taskId
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    ),
  }));
};

// Usage:
handleUpdateTaskStatus('task-2', 'in-progress');
```

**Add a member to a board:**
```typescript
const handleAddMemberToBoard = (boardId, userId) => {
    setDb(currentDb => ({
        ...currentDb,
        boards: currentDb.boards.map(board => 
            (board.id === boardId && !board.memberIds.includes(userId))
              ? { ...board, memberIds: [...board.memberIds, userId] }
              : board
        ),
    }));
};

// Usage:
handleAddMemberToBoard('board-3', 'user-1');
```

### Delete Operations

Deleting involves filtering an item out of an array.

**Delete a task:**
```typescript
const handleDeleteTask = (taskId) => {
  setDb(currentDb => ({
    ...currentDb,
    tasks: currentDb.tasks.filter(task => task.id !== taskId),
  }));
};

// Usage:
handleDeleteTask('task-5');
```

**Delete a board (and its associated tasks):**
```typescript
const handleDeleteBoard = (boardId) => {
    setDb(currentDb => ({
        ...currentDb,
        boards: currentDb.boards.filter(board => board.id !== boardId),
        tasks: currentDb.tasks.filter(task => task.boardId !== boardId),
    }));
};

// Usage:
handleDeleteBoard('board-3');
```
