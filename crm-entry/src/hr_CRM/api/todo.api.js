// src/api/hr/todo.api.js

import hrApi from "./hr.api";

/* ======================================================
   GET ALL TODOS
   ====================================================== */
export const getTodos = async () => {
  try {
    const response = await hrApi.get("/api/Todo");
    return response.data || [];
  } catch (error) {
    console.error("GET TODOS ERROR:", error.response?.data || error.message);
    throw error;
  }
};

/* ======================================================
   CREATE TODO
   ====================================================== */
export const createTodo = async (todoData) => {
  try {
    const response = await hrApi.post("/api/Todo", {
      title: todoData.title,
      description: todoData.description,
      assignedTo: Number(todoData.assignedTo),
      dueDate: todoData.dueDate, // ISO format required
      status: todoData.status,
    });

    return response.data;
  } catch (error) {
    console.error("CREATE TODO ERROR:", error.response?.data || error.message);
    throw error;
  }
};

/* ======================================================
   UPDATE TODO
   ====================================================== */
export const updateTodo = async (id, todoData) => {
  try {
    const response = await hrApi.put(`/api/Todo/${id}`, {
      title: todoData.title,
      description: todoData.description,
      assignedTo: Number(todoData.assignedTo),
      dueDate: todoData.dueDate,
      status: todoData.status,
    });

    return response.data;
  } catch (error) {
    console.error("UPDATE TODO ERROR:", error.response?.data || error.message);
    throw error;
  }
};

/* ======================================================
   DELETE TODO
   ====================================================== */
export const deleteTodo = async (id) => {
  try {
    const response = await hrApi.delete(`/api/Todo/${id}`);
    return response.data;
  } catch (error) {
    console.error("DELETE TODO ERROR:", error.response?.data || error.message);
    throw error;
  }
};