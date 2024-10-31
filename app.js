// PWA 관련 초기화
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => console.log('ServiceWorker 등록 성공:', registration.scope))
            .catch(error => console.log('ServiceWorker 등록 실패:', error));
    });
}

// 앱 상태 관리
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// DOM 요소
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const offlineMessage = document.getElementById('offline-message');

// 오프라인 상태 관리
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
    if (navigator.onLine) {
        offlineMessage.classList.add('hidden');
    } else {
        offlineMessage.classList.remove('hidden');
    }
}

// 할일 추가
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    
    if (text) {
        addTodo(text);
        todoInput.value = '';
    }
});

function addTodo(text) {
    const todo = {
        id: Date.now(),
        text,
        completed: false
    };
    
    todos.push(todo);
    saveTodos();
    renderTodo(todo);
}

// 할일 렌더링
function renderTodo(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    if (todo.completed) li.classList.add('completed');
    
    li.innerHTML = `
        <input type="checkbox" ${todo.completed ? 'checked' : ''}>
        <span>${todo.text}</span>
        <button>삭제</button>
    `;
    
    // 이벤트 리스너 추가
    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    
    const deleteButton = li.querySelector('button');
    deleteButton.addEventListener('click', () => deleteTodo(todo.id));
    
    todoList.appendChild(li);
}

// 할일 상태 토글
function toggleTodo(id) {
    todos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
}

// 할일 삭제
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

// 모든 할일 렌더링
function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach(renderTodo);
}

// localStorage에 저장
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 초기 렌더링
renderTodos();
updateOnlineStatus();