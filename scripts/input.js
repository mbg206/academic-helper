// Colors

const InputElement = {
    COLOR_MENU: document.getElementById("color-menu"),

    SETTINGS_BUTTON: document.getElementById("show-settings"),
    THEME_SELECT: document.getElementById("theme"),
    SETTINGS_CLOSE:  document.getElementById("close-settings"),

    CALENDAR_BUTTON: document.getElementById("show-calendar"),

    COURSES_BUTTON: document.getElementById("show-courses"),

    CREATE_CATEGORY: document.getElementById("create-category"),
    CREATE_COURSE: document.getElementById("create-courses"),

    CREATE_EVENT: document.getElementById("create-event"),
    CREATE_TASK: document.getElementById("create-task"),

    TermConfig: {},
    CourseConfig: {},
    CategoryConfig: {},
    EventConfig: {},
    TaskConfig: {}
};

for (let i = 0; i < 10; i++) {
    const button = document.createElement("button");
    button.className = `color${i}`;
    InputElement.COLOR_MENU.appendChild(button);
}

let colorListenerActive = false;
const enableColorPicker = (input) => input.addEventListener("click", (e) => {
    const menu = InputElement.COLOR_MENU;
    const bounds = input.getBoundingClientRect();
    menu.classList.remove("hidden");
    menu.style.left = `${bounds.left - 63 + (bounds.width / 2)}px`;
    menu.style.top = `${bounds.top + bounds.height}px`;

    e.stopPropagation();
    if (!colorListenerActive) {
        document.addEventListener("click", (e) => {
            menu.classList.add("hidden");
            colorListenerActive = false;
            if (e.target.parentElement === menu) {
                input.className = `color-picker ${e.target.className}`;
            }
        }, {once: true});

        colorListenerActive = true;
    }
});

for (const input of document.getElementsByClassName("color-picker")) {
    enableColorPicker(input);
}

// Days

const enableToggleable = (input) =>
    input.addEventListener("click", () => input.classList.toggle("active"));

for (const input of document.getElementsByClassName("checkbox")) {
    enableToggleable(input);
}


// Show Config Screens

const calendarInput = document.getElementById("calendar-input");

InputElement.SETTINGS_BUTTON.addEventListener("click", () => showScreen(DataScreen.SETTINGS));
InputElement.SETTINGS_CLOSE.addEventListener("click", () => hideScreen());

InputElement.CALENDAR_BUTTON.addEventListener("click", () => calendarInput.showPicker());

InputElement.COURSES_BUTTON.addEventListener("click", () => showScreen(DataScreen.COURSES));

const createMenu = document.getElementById("create-menu");

let buttonListenerActive = false;
document.getElementById("create-menu-toggle").addEventListener("click", (e) => {
    createMenu.classList.remove("hidden");

    e.stopPropagation();

    if (!buttonListenerActive) {
        document.addEventListener("click", (e) => {
            if (e.target === InputElement.CREATE_EVENT) showConfigScreen(ConfigScreen.EDIT_EVENT, EMPTY_EVENT, DATA.events);
            else if (e.target === InputElement.CREATE_TASK) showConfigScreen(ConfigScreen.EDIT_TASK, EMPTY_TASK, DATA.tasks);

            createMenu.classList.add("hidden");
            buttonListenerActive = false;
        }, {once: true});

        buttonListenerActive = true;
    }
});