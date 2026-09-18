const STORAGE_KEY = "todo-app.tasks.v1";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const dueInput = document.getElementById("dueInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const filterBtns = document.querySelectorAll(".filter-btn");
const clearCompletedBtn = document.getElementById("clearCompleted");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // storage unavailable (private mode, quota, etc.) — state stays in memory only
  }
}

function addTask(title, priority, dueDate) {
  tasks.push({
    id: crypto.randomUUID(),
    title,
    priority,
    dueDate: dueDate || null,
    completed: false,
    createdAt: Date.now(),
  });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
}

function getFilteredTasks() {
  if (currentFilter === "active") return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function priorityRank(p) {
  return { high: 0, medium: 1, low: 2 }[p] ?? 3;
}

function isOverdue(dueDate, completed) {
  if (!dueDate || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

function formatDue(dueDate) {
  const [y, m, d] = dueDate.split("-");
  return `${m}/${d}`;
}

function render() {
  const filtered = [...getFilteredTasks()].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return priorityRank(a.priority) - priorityRank(b.priority);
  });

  taskList.innerHTML = "";

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");
    li.dataset.priority = task.priority;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const main = document.createElement("div");
    main.className = "task-main";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priorityLabel = { high: "높음", medium: "보통", low: "낮음" }[task.priority];
    const prioritySpan = document.createElement("span");
    prioritySpan.textContent = priorityLabel;
    meta.appendChild(prioritySpan);

    if (task.dueDate) {
      const dueSpan = document.createElement("span");
      dueSpan.className = "due" + (isOverdue(task.dueDate, task.completed) ? " overdue" : "");
      dueSpan.textContent = formatDue(task.dueDate);
      meta.appendChild(dueSpan);
    }

    main.appendChild(title);
    main.appendChild(meta);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "task-delete";
    deleteBtn.setAttribute("aria-label", "삭제");
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(main);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });

  emptyState.classList.toggle("visible", filtered.length === 0);

  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  progressFill.style.width = total === 0 ? "0%" : `${(done / total) * 100}%`;
  progressText.textContent = `${done} / ${total} 완료`;
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;
  addTask(title, prioritySelect.value, dueInput.value);
  taskInput.value = "";
  dueInput.value = "";
  prioritySelect.value = "medium";
  taskInput.focus();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

clearCompletedBtn.addEventListener("click", clearCompleted);

render();
