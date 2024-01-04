const classNames = {
	TODO_ITEM: "todo-container",
	TODO_CHECKBOX: "todo-checkbox",
	TODO_TEXT: "todo-text",
	TODO_DELETE: "todo-delete",
};

const list = document.getElementById("todo-list");
const itemCountSpan = document.getElementById("item-count");
const uncheckedCountSpan = document.getElementById("unchecked-count");

let itemCount = 0;
let uncheckedCount = 0;

function newTodo() {
	// alert('New TODO button clicked!')
	itemCountSpan.textContent = ++itemCount;
	uncheckedCountSpan.textContent = ++uncheckedCount;

	let id = itemCount;

	let listElem = document.createElement("li");
	listElem.id = itemCount;
	list.appendChild(listElem);

	let todoContainer = document.createElement("div");
	todoContainer.classList.add(classNames.TODO_ITEM);
	listElem.appendChild(todoContainer);

	let todoText = document.createElement("input");
	todoText.classList.add(classNames.TODO_TEXT);
	todoContainer.appendChild(todoText);

	let todoCheck = document.createElement("input");
	todoCheck.classList.add(classNames.TODO_CHECKBOX);
	todoCheck.setAttribute("type", "checkbox");
	todoCheck.setAttribute("onClick", "checkChange(this.checked)");
	todoContainer.appendChild(todoCheck);

	let todoDelete = document.createElement("button");
	todoDelete.classList.add(classNames.TODO_DELETE);
	todoDelete.id = "delete" + id;
	todoDelete.setAttribute("onClick", "deleteTodo(this.id)");
	todoDelete.textContent = "Delete";
	todoContainer.appendChild(todoDelete);
}

function checkChange(nowChecked) {
	if (nowChecked) {
		uncheckedCountSpan.textContent = --uncheckedCount;
	} else {
		uncheckedCountSpan.textContent = ++uncheckedCount;
	}
}

function deleteTodo(id) {
	let deleteButton = document.getElementById(id);
	let todoContainer = deleteButton.parentElement;
	let listElem = todoContainer.parentElement;
	let todoText = todoContainer.children[0];
	let todoCheck = todoContainer.children[1];

	itemCountSpan.textContent = --itemCount;
	if (todoCheck.checked == false) {
		uncheckedCountSpan.textContent = --uncheckedCount;
	}

	deleteButton.remove();
	todoCheck.remove();
	todoText.remove();
	todoContainer.remove();
	listElem.remove();
}
