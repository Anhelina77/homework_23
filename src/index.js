function http({
    url,
    method = 'GET',
    data,
    mode = 'cors',
    cache = 'no-cache',
    credentials = 'same-origin',
    headers,
    redirect,
    referrerPolicy,
    body,
}) {
    return fetch(url, {
        method,
        mode,
        cache,
        credentials,
        headers,
        redirect,
        referrerPolicy,
        body: data ? JSON.stringify(data) : body,
    })
        .then(response => response.json())
        .catch(error => {
            console.log('http error', error);
            return error;
        });
}

class Storage {
    constructor(name) {
        this.name = name;
    }

    set = value => {
        localStorage.setItem(this.name, JSON.stringify(value));
    };

    get = () => JSON.parse(localStorage.getItem(this.name));
}

class TodoList {
    constructor(list) {
        this.list = list || [];
        this.auth = '';
    }

    login = async value => {
        const res = await http({
            method: 'POST',
            url: '/auth/login',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            data: { value },
        });

        if (res.access_token) {
            this.auth = `Bearer ${res.access_token}`;
            return res;
        }
    };

    getList = async () => {
        if (!this.auth) {
            return null;
        }
        const res = await http({
            url: '/todo',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this.auth,
            },
        });
        if (Array.isArray(res)) {
            this.list = res;
            return res;
        }
    };

    addTask = async ({ value, priority = 1 }) => {
        if (!this.auth) {
            return null;
        }
        const res = await http({
            url: '/todo',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this.auth,
            },
            data: {
                value,
                priority: Number(priority),
            },
        });
        if (res._id) {
            this.list.push(res);
            return res;
        }
    };

    removeTask = async _id => {
        if (!this.auth) {
            return null;
        }
        const res = await http({
            url: `/todo/${_id}`,
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this.auth,
            },
        });
        if (!res.message) {
            this.list = this.list.filter(item => item._id !== _id);
        }
        return !res.message;
    };

    editTask = async ({ _id, value, priority = 1 }) => {
        if (!this.auth) {
            return null;
        }
        const res = await http({
            url: `/todo/${_id}`,
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this.auth,
            },
            data: {
                value,
                priority: Number(priority),
            },
        });
        if (res._id) {
            this.list.forEach((item, index) => {
                if (item._id === _id) {
                    this.list[index] = res;
                }
            });
        }
        return res;
    };

    checkedTask = async _id => {
        if (!this.auth) {
            return null;
        }
        const res = await http({
            url: `/todo/${_id}/toggle`,
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this.auth,
            },
        });
        if (res._id) {
            this.list.forEach((item, index) => {
                if (item._id === _id) {
                    this.list[index] = res;
                }
            });
        }
        return res;
    };

    info = () => {
        const all = this.list.length;
        const completed = this.list.filter(item => item.checked).length;
        return {
            all,
            completed,
            performing: all - completed,
        };
    };
}

class TodoInfo {
    constructor(info) {
        this.all = info.all;
        this.completed = info.completed;
        this.performing = info.performing;
    }

    update = info => {
        this.all = info.all;
        this.completed = info.completed;
        this.performing = info.performing;

        const all = this.container.querySelector('#all');
        const completed = this.container.querySelector('#completed');
        const performing = this.container.querySelector('#performing');
        all.innerText = 'all: ' + this.all;
        completed.innerText = 'completed: ' + this.completed;
        performing.innerText = 'performing: ' + this.performing;
    };

    render = () => {
        this.container = document.createElement('div');
        const all = document.createElement('div');
        all.id = 'all';
        all.innerText = 'all: ' + this.all;

        const completed = document.createElement('div');
        completed.id = 'completed';
        completed.innerText = 'completed: ' + this.completed;

        const performing = document.createElement('div');
        performing.id = 'performing';
        performing.innerText = 'performing: ' + this.performing;

        this.container.innerHTML = ''; // reset
        this.container.appendChild(all);
        this.container.appendChild(completed);
        this.container.appendChild(performing);

        return this.container;
    };
}

class TodoCreate {
    constructor(createTask) {
        this.createTask = createTask;
    }

    renderText = () => {
        const ceil = document.createElement('td');
        ceil.setAttribute('width', '20%');
        const text = document.createElement('input');
        text.setAttribute('required', '');
        text.placeholder = 'text';
        text.classList.add('text');
        ceil.appendChild(text);

        return ceil;
    };

    renderPriority = () => {
        const ceil = document.createElement('td');
        ceil.setAttribute('width', '5%');
        const priority = document.createElement('input');
        priority.setAttribute('required', '');
        priority.type = 'number';
        priority.style.width = '30px';
        priority.min = '1';
        priority.max = '100';
        priority.classList.add('priority');
        priority.value = '1';
        ceil.appendChild(priority);

        return ceil;
    };

    renderAdd = () => {
        const ceil = document.createElement('td');
        ceil.setAttribute('width', '20%');
        const add = document.createElement('button');
        add.type = 'submit';
        add.innerText = 'Add task';
        ceil.appendChild(add);

        return ceil;
    };

    renderTable = () => {
        const table = document.createElement('table');
        table.setAttribute('width', '100%');
        table.setAttribute('height', '100px');
        const row = document.createElement('tr');
        const last = document.createElement('td');

        row.appendChild(this.renderText());
        row.appendChild(this.renderPriority());
        row.appendChild(this.renderAdd());
        row.appendChild(last);
        table.appendChild(row);

        return table;
    };

    clear = () => {
        console.log(this.container.querySelector('.text').value);
        this.container.querySelector('.text').value = '';
        this.container.querySelector('.priority').value = '1';
    };

    render = () => {
        this.container = document.createElement('form');
        this.container.setAttribute('action', '#');
        this.container.addEventListener('submit', this.createTask);

        this.container.innerHTML = ''; // reset
        this.container.appendChild(this.renderTable());

        return this.container;
    };
}

class TodoItem {
    constructor(task, saveTask, checkedTask, removeTask) {
        this.task = task;
        this.saveTask = saveTask;
        this.checkedTask = checkedTask;
        this.removeTask = removeTask;
    }

    renderTitle = () => {
        const ceil = document.createElement('td');
        ceil.setAttribute('width', '10%');
        const title = document.createElement('span');
        title.classList.add('title');
        title.innerText = this.task.user;
        ceil.appendChild(title);
        return ceil;
    };

    renderText = () => {
        const ceil = document.createElement('td');
        ceil.setAttribute('width', '20%');
        const text = document.createElement('input');
        text.setAttribute('required', '');
        text.classList.add('text');
        text.value = this.task.value;
        ceil.appendChild(text);

        return ceil;
    };

    renderPriority = () => {
        const ceil = document.createElement('td');
        ceil.setAttribute('width', '5%');
        const priority = document.createElement('input');
        priority.setAttribute('required', '');
        priority.type = 'number';
        priority.style.width = '30px';
        priority.min = '1';
        priority.max = '100';
        priority.classList.add('priority');
        priority.value = this.task.priority;
        ceil.appendChild(priority);

        return ceil;
    };

    renderCompleted = () => {
        const ceil = document.createElement('td');
        ceil.setAttribute('width', '5%');
        const completed = document.createElement('input');
        completed.classList.add('completed');
        completed.type = 'checkbox';
        completed.checked = this.task.checked;
        completed.addEventListener('change', this.checkedTask(this.task._id));
        ceil.appendChild(completed);

        return ceil;
    };

    renderSave = () => {
        const ceil = document.createElement('td');
        ceil.setAttribute('width', '20%');
        const save = document.createElement('button');
        save.type = 'submit';
        save.innerText = 'Save task';
        ceil.appendChild(save);

        return ceil;
    };

    renderRemove = () => {
        const ceil = document.createElement('td');
        ceil.setAttribute('width', '20%');
        const remove = document.createElement('button');
        remove.addEventListener('click', this.removeTask(this.task._id, this.container));
        remove.type = 'button';
        remove.innerText = 'Remove task';
        ceil.appendChild(remove);

        return ceil;
    };

    renderTable = () => {
        const table = document.createElement('table');
        table.setAttribute('width', '100%');
        const row = document.createElement('tr');
        const last = document.createElement('td');

        row.appendChild(this.renderTitle());
        row.appendChild(this.renderText());
        row.appendChild(this.renderPriority());
        row.appendChild(this.renderCompleted());
        row.appendChild(this.renderSave());
        row.appendChild(this.renderRemove());
        row.appendChild(last);
        table.appendChild(row);

        return table;
    };

    render = () => {
        this.container = document.createElement('form');
        this.container.setAttribute('action', '#');
        this.container.addEventListener('submit', this.saveTask(this.task._id));

        this.container.innerHTML = ''; // reset
        this.container.appendChild(this.renderTable());

        return this.container;
    };
}

class Todo {
    constructor(name) {
        this.storage = new Storage(name);
        this.todo = new TodoList(this.storage.get());
    }

    init = async name => {
        const login = await this.todo.login(name);
        const list = login.access_token && (await this.todo.getList());
        list && this.storage.set(this.todo.list);
        return list;
    };

    createTask = async e => {
        e.preventDefault();
        const form = e.currentTarget;
        const task = {
            value: form.querySelector('.text').value,
            priority: form.querySelector('.priority').value,
        };
        const res = await this.todo.addTask(task);
        if (res._id) {
            this.storage.set(this.todo.list);
            const item = new TodoItem(res, this.saveTask, this.checkedTask, this.removeTask);
            this.container.appendChild(item.render());
            this.infoContainer.update(this.todo.info());
            this.createContainer.clear();
        }
    };

    saveTask = _id => async e => {
        e.preventDefault();
        const form = e.currentTarget;
        const task = {
            _id,
            value: form.querySelector('.text').value,
            priority: form.querySelector('.priority').value,
        };
        const res = await this.todo.editTask(task);
        if (res._id) {
            this.storage.set(this.todo.list);
            this.infoContainer.update(this.todo.info());
        }
    };

    checkedTask = _id => async e => {
        e.preventDefault();
        const checkbox = e.currentTarget;
        const res = await this.todo.checkedTask(_id);
        if (res._id) {
            this.storage.set(this.todo.list);
            this.infoContainer.update(this.todo.info());
        } else {
            checkbox.checked = !checkbox.checked;
        }
    };

    removeTask = (_id, todoItem) => async () => {
        const res = await this.todo.removeTask(_id);
        if (res) {
            this.storage.set(this.todo.list);
            this.container.removeChild(todoItem);
            this.infoContainer.update(this.todo.info());
        }
    };

    render = () => {
        this.container = document.createElement('div');
        this.infoContainer = new TodoInfo(this.todo.info());
        this.createContainer = new TodoCreate(this.createTask);

        this.container.innerHTML = ''; // reset
        this.container.appendChild(this.infoContainer.render());
        this.container.appendChild(this.createContainer.render());
        this.todo.list.forEach(task => {
            const item = new TodoItem(task, this.saveTask, this.checkedTask, this.removeTask);
            this.container.appendChild(item.render());
        });

        return this.container;
    };
}

const developers = new Todo('developers');

developers.init('Test user').then(() => {
    document.body.prepend(developers.render());
});
