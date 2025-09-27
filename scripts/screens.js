const screenContainer = document.getElementById("screen-overlay");

const createInput = (container, type, label, id, smallLabel = false) => {
    const labelElement = createElement("label", {text: label});
    if (smallLabel) labelElement.className = "small-label";
    if (id !== null) labelElement.for = id;

    let input;

    switch (type) {
        case "select":
            input = createElement("select", {id});
            break;

        case "color":
            input = createElement("button", {id, class: "color-picker"});
            enableColorPicker(input);
            break;

        case "checkbox":
            input = createElement("button", {class: "checkbox"});
            enableToggleable(input);
            break;

        case "datetime":
            input = createElement("div", {class: "datetime", children: [
                createElement("input", {id, class: "datetime", type: "date"}),
                createElement("input", {class: "datetime", type: "time"})
            ]});
            break;

        case "timerange":
            input = createElement("div", {class: "datetime", children: [
                createElement("input", {id, type: "time"}),
                document.createTextNode(" - "),
                createElement("input", {type: "time"})
            ]});
            break;

        case "days": {
            const buttons = ["S", "M", "T", "W", "T", "F", "S"].map(day => createElement("button", {class: "course-day-toggle", text: day}));
            buttons.forEach(enableToggleable);

            input = createElement("div", {
                class: "day-picker",
                children: buttons
            });
            break;
        }

        default:
            input = createElement("input", {id, type});
            if (type === "text") input.maxLength = 50;
            break;
    }
    
    container.append(labelElement, input);
    return input;
};

const createConfigScreen = (title) => {
    const deleteButton = createElement("button", {class: "pebble", text: "delete_forever"});
    const configArea = createElement("div", {class: "config-area"});
    const saveButton = createElement("button", {class: "save-button", text: "Save"});

    const screen = createElement("div", {class: "config-screen hidden", children: [
        createElement("div", {class: "config-header", children: [
            createElement("h3", {text: title}),
            deleteButton
        ]}),
        configArea,
        saveButton
    ]});

    screenContainer.appendChild(screen);

    return {screen, deleteButton, configArea, saveButton};
};



let visibleScreen = null;

const showScreen = (screen) => {
    if (screen === null) return hideScreen();

    if (visibleScreen !== null)
        visibleScreen.classList.add("hidden");

    screenContainer.classList.remove("hidden");
    screen.classList.remove("hidden");
    visibleScreen = screen;
};
const hideScreen = () => {
    visibleScreen.classList.add("hidden");
    visibleScreen = null;
    screenContainer.classList.add("hidden");
};



const DataScreen = {
    SETTINGS: document.getElementById("settings"),
    COURSE_INFOCARD: document.getElementById("course-infocard"),
    SCHEDULE_INFOCARD: document.getElementById("schedule-infocard"),
    COURSES: document.getElementById("courses"),
};

screenContainer.addEventListener("click", (e) => {
    if (e.target === screenContainer && ([
        DataScreen.COURSE_INFOCARD,
        DataScreen.SCHEDULE_INFOCARD,
        DataScreen.COURSES
    ].includes(visibleScreen)))
        hideScreen();
});



const ConfigScreen = {};

const enableConfigScreen = (screen, updateFunction, nextScreen = null, postFunction = null) => {
    screen.deleteButton.addEventListener("click", () => {
        trashConfigScreen(updateFunction, nextScreen);
        if (postFunction !== null) postFunction();
    });
    screen.saveButton.addEventListener("click", () => {
        saveConfigScreen(updateFunction, nextScreen);
        if (postFunction !== null) postFunction();
    });
};

const createSubtask = (subtask) => {
    const element = createElement("div", {class: "subtask"});
    const id = Math.floor(Math.random() * 999999);

    const name = createInput(element, "text", "Name", `subtask${id}-name`);
    setInputValue(name, subtask.name);

    const trashButton = createElement("button", {class: "pebble", text: "delete"});
    trashButton.addEventListener("click", () => element.remove());
    element.appendChild(createElement("div", {class: "subtask-trash-container", children: [trashButton]}));

    const note = createInput(element, "text", "Note", `subtask${id}-note`, true);
    setInputValue(note, subtask.note);

    const endDatetime = createInput(element, "datetime", "Due", `subtask${id}-end`);
    setDatetime(subtask.end, endDatetime.children[0], endDatetime.children[1]);

    element.setAttribute("data-completed", subtask.completed);
    InputElement.TaskConfig.SUBTASKS.appendChild(element);
};

(() => {
    // Edit Term

    const editTerm = createConfigScreen("Edit Term");
    ConfigScreen.EDIT_TERM = editTerm.screen;
    InputElement.TermConfig.NAME =  createInput(editTerm.configArea, "text", "Name", "term-name");
    InputElement.TermConfig.START = createInput(editTerm.configArea, "date", "Start", "term-start");
    InputElement.TermConfig.END =   createInput(editTerm.configArea, "date", "End", "term-end");

    enableConfigScreen(editTerm, buildSchedule, DataScreen.COURSES);

    // Edit Course

    const editCourse = createConfigScreen("Edit Course");
    ConfigScreen.EDIT_COURSE = editCourse.screen;

    const termButton = createElement("button", {class: "pebble", text: "add"});
    termButton.addEventListener("click", () => showConfigScreen(ConfigScreen.EDIT_TERM, EMPTY_TERM, DATA.terms));
    editCourse.screen.children[0].prepend(termButton);

    InputElement.CourseConfig.COURSE =     createInput(editCourse.configArea, "text", "Course", "course-course");
    InputElement.CourseConfig.NAME =       createInput(editCourse.configArea, "text", "Name", "course-course");
    InputElement.CourseConfig.BUILDING =   createInput(editCourse.configArea, "text", "Building", "course-course");
    InputElement.CourseConfig.ROOM =       createInput(editCourse.configArea, "text", "Room", "course-course");
    InputElement.CourseConfig.INSTRUCTOR = createInput(editCourse.configArea, "text", "Instructor", "course-course");

    const timeContainer = createInput(editCourse.configArea, "timerange", "Time", "course-time");

    InputElement.CourseConfig.START = timeContainer.children[0];
    InputElement.CourseConfig.END =   timeContainer.children[1];

    InputElement.CourseConfig.DAYS =  createInput(editCourse.configArea, "days", "Days", null);
    InputElement.CourseConfig.TERM =  createInput(editCourse.configArea, "select", "Term", null);
    InputElement.CourseConfig.COLOR = createInput(editCourse.configArea, "color", "Color", "course-color");

    enableConfigScreen(editCourse, buildSchedule, DataScreen.COURSES);

    // Edit Category

    const editCategory = createConfigScreen("Edit Category");
    ConfigScreen.EDIT_CATEGORY = editCategory.screen;
    InputElement.CategoryConfig.NAME =  createInput(editCategory.configArea, "text", "Name", "category-name");
    InputElement.CategoryConfig.COLOR = createInput(editCategory.configArea, "color", "Color", "category-color");

    enableConfigScreen(editCategory, showCategories, DataScreen.SETTINGS);

    // Edit Event

    const editEvent = createConfigScreen("Edit Event");
    ConfigScreen.EDIT_EVENT = editEvent.screen;
    InputElement.EventConfig.NAME = createInput(editEvent.configArea, "text", "Name", "event-name");
    InputElement.EventConfig.NOTE = createInput(editEvent.configArea, "text", "Note", "event-note", true);

    const startDatetimeE = createInput(editEvent.configArea, "datetime", "Start", "term-start");
    const endDatetimeE = createInput(editEvent.configArea, "datetime", "End", "term-end", true);
    InputElement.EventConfig.START_DATE = startDatetimeE.children[0];
    InputElement.EventConfig.START_TIME = startDatetimeE.children[1];
    InputElement.EventConfig.END_DATE =   endDatetimeE.children[0];
    InputElement.EventConfig.END_TIME =   endDatetimeE.children[1];

    InputElement.EventConfig.CATEGORY = createInput(editEvent.configArea, "select", "Category", "term-category");
    InputElement.EventConfig.BREAK =    createInput(editEvent.configArea, "checkbox", "No Classes?", "term-break");

    enableConfigScreen(editEvent, updateEvents);

    // Edit Task

    const editTask = createConfigScreen("Edit Task");
    ConfigScreen.EDIT_TASK = editTask.screen;
    InputElement.TaskConfig.NAME = createInput(editTask.configArea, "text", "Name", "task-name");
    InputElement.TaskConfig.NOTE = createInput(editTask.configArea, "text", "Note", "task-note", true);

    const startDatetimeT = createInput(editTask.configArea, "datetime", "Start", "term-start", true);
    const endDatetimeT = createInput(editTask.configArea, "datetime", "Due", "term-end");
    InputElement.TaskConfig.START_DATE = startDatetimeT.children[0];
    InputElement.TaskConfig.START_TIME = startDatetimeT.children[1];
    InputElement.TaskConfig.END_DATE =   endDatetimeT.children[0];
    InputElement.TaskConfig.END_TIME =   endDatetimeT.children[1];

    const subtasks = createElement("div", {id: "subtasks"});
    const subtaskCreate = createElement("button", {class: "pebble", text: "add"});
    const subtaskContainer = createElement("div", {id: "subtasks-container", children: [
        createElement("div", {id: "subtasks-header", children: [
            createElement("span", {text: "Subtasks"}),
            subtaskCreate
        ]}),
        subtasks
    ]});

    subtaskCreate.addEventListener("click", () => createSubtask(EMPTY_SUBTASK));

    InputElement.TaskConfig.SUBTASKS = subtasks;
    endDatetimeT.after(subtaskContainer);

    InputElement.TaskConfig.CATEGORY =    createInput(editTask.configArea, "select", "Category", "task-category");
    InputElement.TaskConfig.UNIMPORTANT = createInput(editTask.configArea, "checkbox", "Unimportant?", "task-unimportant", true);

    enableConfigScreen(editTask, updateTasks);
})();