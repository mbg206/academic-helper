const getTimeOffset = () => new Date(selectedDate).getTimezoneOffset() * 60000;
const toUTC = (local) => local + getTimeOffset();
const fromUTC = (utc) => utc - getTimeOffset();

const getInputValue = (element) => {
    if (element.classList.contains("color-picker"))
        return element.className.slice(13);

    if (element.classList.contains("checkbox"))
        return element.classList.contains("active");

    if (element.className === "day-picker") {
        const days = [];
        for (let i = 0; i < 7; i++) {
            if (element.children[i].classList.contains("active"))
                days.push(i);
        }
        return days;
    }

    if (element.type === "date" || element.type === "time")
        return isNaN(element.valueAsNumber) ? null : element.valueAsNumber;

    return element.value;
};

const setInputValue = (element, value) => {
    if (element.classList.contains("color-picker"))
        element.classList = `color-picker ${value}`;

    else if (element.classList.contains("checkbox"))
        element.classList.toggle("active", value);

    else if (element.className === "day-picker") {
        for (let i = 0; i < 7; i++)
            element.children[i].classList.toggle("active", value.includes(i));
    }

    else if (element.type === "date" || element.type === "time")
        element.valueAsNumber = value === null ? NaN : value;

    else element.value = value;
};



// converts object to HTML inputs
const CONFIG_SCREEN_BUILDERS = new Map();
// converts HTML inputs to object
const CONFIG_SCREEN_GETTERS = new Map();
// validates proper format of HTML inputs before saving
const CONFIG_SCREEN_VALIDATORS = new Map();
// validates possibility of trashing an item (e.g. cannot delete a category that is being used)
const CONFIG_SCREEN_TRASH_VALIDATORS = new Map();
// updates existing object save (e.g. updating a category name change)
const CONFIG_SCREEN_UPDATERS = new Map();

let currentlyEditingArray;

const showConfigScreen = (screen, source, array, index = null) => {
    const builder = CONFIG_SCREEN_BUILDERS.get(screen);
    builder(source);

    currentlyEditingArray = array;
    currentlyEditingIndex = index;
    showScreen(screen);
};

const saveConfigScreen = (updateFunction, nextScreen = null) => {
    const getter = CONFIG_SCREEN_GETTERS.get(visibleScreen);
    const data = getter();

    const validator = CONFIG_SCREEN_VALIDATORS.get(visibleScreen);
    if (!validator(data)) return;

    if (currentlyEditingIndex === null)
        currentlyEditingArray.push(data);
    else {
        const updater = CONFIG_SCREEN_UPDATERS.get(visibleScreen);
        if (updater !== undefined) updater(currentlyEditingArray[currentlyEditingIndex], data);
        currentlyEditingArray[currentlyEditingIndex] = data;
    }

    sortArray(currentlyEditingArray);
    saveData();
    updateFunction();

    showScreen(nextScreen);
};

const trashConfigScreen = (updateFunction, nextScreen = null) => {
    if (currentlyEditingIndex !== null) {
        if (visibleScreen === ConfigScreen.EDIT_CATEGORY && DATA.categories.length === 1) return;

        const validator = CONFIG_SCREEN_TRASH_VALIDATORS.get(visibleScreen);
        if (validator !== undefined) {
            const getter = CONFIG_SCREEN_GETTERS.get(visibleScreen);
            const data = getter();
            if (!validator(data)) return;
        }

        currentlyEditingArray.splice(currentlyEditingIndex, 1);
    }

    saveData();
    updateFunction();

    showScreen(nextScreen);
};

const isNull = (v) => v === null;
const checkStartEnd = (start, end) => !isNull(start) && !isNull(end) && (start < end);

InputElement.CREATE_CATEGORY.addEventListener("click", () => showConfigScreen(ConfigScreen.EDIT_CATEGORY, EMPTY_CATEGORY, DATA.categories));
InputElement.CREATE_COURSE.addEventListener("click", () => {
    if (getCurrentTerms().length === 0)
        showConfigScreen(ConfigScreen.EDIT_TERM, EMPTY_TERM, DATA.terms);
    else
        showConfigScreen(ConfigScreen.EDIT_COURSE, EMPTY_COURSE, DATA.courses);
});

const getDatetime = (date, time) => {
    if (date === null) return null;
    if (time === null) return {
        time: date,
        allDay: true
    };
    return {
        time: toUTC(date + time),
        allDay: false
    };
};
const setDatetime = (datetime, dateInput, timeInput) => {
    if (datetime === null) {
        dateInput.valueAsNumber = NaN;
        timeInput.valueAsNumber = NaN;
    }
    else if (datetime.allDay) {
        dateInput.valueAsNumber = datetime.time;
        timeInput.valueAsNumber = NaN;
    }
    else {
        const date = fromUTC(datetime.time);
        const time = date % DAY_MS;
        dateInput.valueAsNumber = date - time;
        timeInput.valueAsNumber = time;
    }
};

const getSubtasks = () => {
    const subtasks = [];
    for (const element of InputElement.TaskConfig.SUBTASKS.children) {
        subtasks.push({
            name: getInputValue(element.children[1]),
            note: getInputValue(element.children[4]),
            end: getDatetime(
                getInputValue(element.children[6].children[0]),
                getInputValue(element.children[6].children[1])
            ),
            completed: element.getAttribute("data-completed") === "true"
        });
    }
    return subtasks;
};


CONFIG_SCREEN_BUILDERS.set(ConfigScreen.EDIT_TERM, (term) => {
    setInputValue(InputElement.TermConfig.NAME, term.name);
    setInputValue(InputElement.TermConfig.START, term.start);
    setInputValue(InputElement.TermConfig.END, term.end);
});

CONFIG_SCREEN_GETTERS.set(ConfigScreen.EDIT_TERM, () => ({
    name: getInputValue(InputElement.TermConfig.NAME),
    start: getInputValue(InputElement.TermConfig.START),
    end: getInputValue(InputElement.TermConfig.END)
}));

CONFIG_SCREEN_VALIDATORS.set(ConfigScreen.EDIT_TERM, (term) =>
    (term.name.length > 0) &&
    checkStartEnd(term.start, term.end) &&
    (DATA.terms.findIndex((t, i) => i !== currentlyEditingIndex && t.name === term.name) === -1)
);

CONFIG_SCREEN_TRASH_VALIDATORS.set(ConfigScreen.EDIT_TERM, (term) =>
    (DATA.courses.findIndex(course => course.term === term.name) === -1)
);

CONFIG_SCREEN_UPDATERS.set(ConfigScreen.EDIT_TERM, (oldTerm, newTerm) => {
    for (const course of DATA.courses) {
        if (course.term === oldTerm.name) course.term = newTerm.name;
    }
});



CONFIG_SCREEN_BUILDERS.set(ConfigScreen.EDIT_COURSE, (course) => {
    setInputValue(InputElement.CourseConfig.COURSE, course.course);
    setInputValue(InputElement.CourseConfig.NAME, course.name);
    setInputValue(InputElement.CourseConfig.BUILDING, course.building);
    setInputValue(InputElement.CourseConfig.ROOM, course.room);
    setInputValue(InputElement.CourseConfig.INSTRUCTOR, course.instructor);
    setInputValue(InputElement.CourseConfig.START, course.startTime);
    setInputValue(InputElement.CourseConfig.END, course.endTime);
    setInputValue(InputElement.CourseConfig.DAYS, course.days);
    setInputValue(InputElement.CourseConfig.TERM, course.term);
    setInputValue(InputElement.CourseConfig.COLOR, course.color);
});

CONFIG_SCREEN_GETTERS.set(ConfigScreen.EDIT_COURSE, () => ({
    course: getInputValue(InputElement.CourseConfig.COURSE),
    name: getInputValue(InputElement.CourseConfig.NAME),
    building: getInputValue(InputElement.CourseConfig.BUILDING),
    room: getInputValue(InputElement.CourseConfig.ROOM),
    instructor: getInputValue(InputElement.CourseConfig.INSTRUCTOR),
    startTime: getInputValue(InputElement.CourseConfig.START),
    endTime: getInputValue(InputElement.CourseConfig.END),
    days: getInputValue(InputElement.CourseConfig.DAYS),
    term: getInputValue(InputElement.CourseConfig.TERM),
    color: getInputValue(InputElement.CourseConfig.COLOR)
}));

CONFIG_SCREEN_VALIDATORS.set(ConfigScreen.EDIT_COURSE, (course) =>
    (course.course.length > 0) &&
    checkStartEnd(course.startTime, course.endTime) &&
    (course.days.length > 0) &&
    (course.term.length > 0) &&
    (DATA.courses.findIndex((c, i) => i !== currentlyEditingIndex && c.course === course.course) === -1)
);



CONFIG_SCREEN_BUILDERS.set(ConfigScreen.EDIT_CATEGORY, (category) => {
    setInputValue(InputElement.CategoryConfig.NAME, category.name);
    setInputValue(InputElement.CategoryConfig.COLOR, category.color);
});

CONFIG_SCREEN_GETTERS.set(ConfigScreen.EDIT_CATEGORY, () => ({
    name: getInputValue(InputElement.CategoryConfig.NAME),
    color: getInputValue(InputElement.CategoryConfig.COLOR)
}));

CONFIG_SCREEN_VALIDATORS.set(ConfigScreen.EDIT_CATEGORY, (category) =>
    (category.name.length > 0) &&
    (DATA.categories.findIndex((c, i) => i !== currentlyEditingIndex && c.name === category.name) === -1)
);

CONFIG_SCREEN_TRASH_VALIDATORS.set(ConfigScreen.EDIT_CATEGORY, (category) =>
    (DATA.events.findIndex(event => event.category === category.name) === -1) &&
    (DATA.tasks.findIndex(task => task.category === category.name) === -1)
);

CONFIG_SCREEN_UPDATERS.set(ConfigScreen.EDIT_CATEGORY, (oldCategory, newCategory) => {
    for (const event of DATA.events)
        if (event.category === oldCategory.name) event.category = newCategory.name;
    for (const task of DATA.tasks)
        if (task.category === oldCategory.name) task.category = newCategory.name;
});



CONFIG_SCREEN_BUILDERS.set(ConfigScreen.EDIT_EVENT, (event) => {
    setInputValue(InputElement.EventConfig.NAME, event.name);
    setInputValue(InputElement.EventConfig.NOTE, event.note);
    setDatetime(event.start, InputElement.EventConfig.START_DATE, InputElement.EventConfig.START_TIME);
    setDatetime(event.end, InputElement.EventConfig.END_DATE, InputElement.EventConfig.END_TIME);
    setInputValue(InputElement.EventConfig.CATEGORY, event.category);
    setInputValue(InputElement.EventConfig.BREAK, event.break);
});

CONFIG_SCREEN_GETTERS.set(ConfigScreen.EDIT_EVENT, () => ({
    name: getInputValue(InputElement.EventConfig.NAME),
    note: getInputValue(InputElement.EventConfig.NOTE),
    start: getDatetime(
        getInputValue(InputElement.EventConfig.START_DATE),
        getInputValue(InputElement.EventConfig.START_TIME)
    ),
    end: getDatetime(
        getInputValue(InputElement.EventConfig.END_DATE),
        getInputValue(InputElement.EventConfig.END_TIME)
    ),
    category: getInputValue(InputElement.EventConfig.CATEGORY),
    break: getInputValue(InputElement.EventConfig.BREAK)
}));

CONFIG_SCREEN_VALIDATORS.set(ConfigScreen.EDIT_EVENT, (event) =>
    (event.name.length > 0) &&
    (event.start !== null) &&
    (event.category.length > 0)
);



CONFIG_SCREEN_BUILDERS.set(ConfigScreen.EDIT_TASK, (task) => {
    setInputValue(InputElement.TaskConfig.NAME, task.name);
    setInputValue(InputElement.TaskConfig.NOTE, task.note);
    setDatetime(task.start, InputElement.TaskConfig.START_DATE, InputElement.TaskConfig.START_TIME);
    setDatetime(task.end, InputElement.TaskConfig.END_DATE, InputElement.TaskConfig.END_TIME);
    InputElement.TaskConfig.SUBTASKS.innerHTML = "";
    task.subtasks.forEach(createSubtask);
    setInputValue(InputElement.TaskConfig.CATEGORY, task.category);
    setInputValue(InputElement.TaskConfig.UNIMPORTANT, task.unimportant);
    ConfigScreen.EDIT_TASK.setAttribute("data-completed", task.completed);
});

CONFIG_SCREEN_GETTERS.set(ConfigScreen.EDIT_TASK, () => ({
    name: getInputValue(InputElement.TaskConfig.NAME),
    note: getInputValue(InputElement.TaskConfig.NOTE),
    start: getDatetime(
        getInputValue(InputElement.TaskConfig.START_DATE),
        getInputValue(InputElement.TaskConfig.START_TIME)
    ),
    end: getDatetime(
        getInputValue(InputElement.TaskConfig.END_DATE),
        getInputValue(InputElement.TaskConfig.END_TIME)
    ),
    subtasks: getSubtasks(),
    category: getInputValue(InputElement.TaskConfig.CATEGORY),
    unimportant: getInputValue(InputElement.TaskConfig.UNIMPORTANT),
    completed: ConfigScreen.EDIT_TASK.getAttribute("data-completed") === "true",
}));

CONFIG_SCREEN_VALIDATORS.set(ConfigScreen.EDIT_TASK, (task) =>
    (task.name.length > 0) &&
  //(task.start !== null) &&
    (task.category.length > 0)
);