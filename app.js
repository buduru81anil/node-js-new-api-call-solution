const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", status, priority } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = `
                SELECT *
                FROM 
                todo
                WHERE 
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND status = '${status}';
            `;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
                SELECT * 
                FROM todo
                WHERE 
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';
            `;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
                SELECT *
                FROM todo
                WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}';
            `;
      break;
    default:
      getTodosQuery = `
                SELECT *
                FROM todo
                WHERE 
                todo LIKE '%${search_q}%';
            `;
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT *
        FROM todo
        WHERE 
        id = ${todoId};
    `;
  const getTodo = await db.get(getTodoQuery);
  response.send(getTodo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodo = `
        INSERT INTO todo
        (id, todo, priority, status)
        VALUES
        (
            ${id},
            '${todo}',
            '${priority}',
            '${status}'
        );
    `;
  await db.run(createTodo);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let todoColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.priority !== undefined:
      todoColumn = "Priority";
      break;
    case requestBody.status !== undefined:
      todoColumn = "Status";
      break;
    case requestBody.todo !== undefined:
      todoColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT *
    FROM todo
    WHERE
    id = ${todoId};
  `;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE todo
    SET 
    todo = '${todo}',
    status = '${status}',
    priority = '${priority}'
    WHERE 
    id = ${todoId};
  `;
  await db.run(updateTodoQuery);
  response.send(`${todoColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
