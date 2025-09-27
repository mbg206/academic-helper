const UIElements = {
    headerTodayText: document.getElementById("date-today"),
    headerDateText: document.getElementById("date"),
    scheduleDateText: document.getElementById("schedule-infocard-header"),

    currentTimeText: document.getElementById("current-time"),
    showCompletedTasks: document.getElementById("show-completed")
};

const DAY_MS = 86400000;

const createElement = (tag, options) => {
    const e = document.createElement(tag);
    if (options.text) e.textContent = options.text;
    if (options.class) e.className = options.class;
    if (options.id) e.id = options.id;
    if (options.type) e.type = options.type;
    if (options.children) e.append(...options.children);
    return e;
};

const scheduleContainer = document.getElementById("schedule-container");

const categories = document.getElementById("categories");

// date selection

let selectedDate;
let isBreak;

const selectDate = (year, month, day) => {
    selectedDate = new Date(0);
    selectedDate.setFullYear(year, month, day);
    selectedDate.setHours(0, 0, 0, 0);

    const date = new Date();
    date.setHours(0, 0, 0, 0);
    todaySelected = date.getTime() == selectedDate.getTime();
    reloadDay();
};

const selectToday = () => {
    selectedDate = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    todaySelected = true;
    reloadDay();
};

calendarInput.addEventListener("input", () => {
    if (calendarInput.value.length === 0) reloadDay();
    else selectDate(
        parseInt(calendarInput.value.slice(0, 4)),
        parseInt(calendarInput.value.slice(5, 7)) - 1,
        parseInt(calendarInput.value.slice(8, 10))
    );
});

// ui utils

const minutesToPx = (time) => time * (2304/1439);

const showDate = () => {
    UIElements.headerTodayText.style.display = todaySelected ? "inline" : "none";
    UIElements.headerDateText.textContent = selectedDate.toLocaleString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    UIElements.scheduleDateText.textContent = "Schedule for " + selectedDate.toLocaleString(undefined, {
        month: "numeric",
        day: "numeric",
        year: "numeric"
    });
};

const formatTime = (time) => new Date(time).toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit", timeZone: "UTC"});
const formatCourseTime = (course) => `${formatTime(course.startTime)} - ${formatTime(course.endTime)}`;
const shortDate = (time) => new Date(time).toLocaleDateString(undefined, {timeZone: "UTC", month: "short", day: "numeric"});
const shortDatetime = (time, showTime = false) => new Date(time).toLocaleDateString(undefined, {month: "short", day: "numeric", hour: showTime ? "numeric" : undefined, minute: showTime ? "2-digit" : undefined});

const daysToStr = (days) => days.map(day => ["Su", "M", "Tu", "W", "Th", "F", "Sa"][day]).join(", ");


// show course infocard

const courseInfocard = document.getElementById("course-infocard");

const showCourse = (course) => {
    courseInfocard.innerHTML = "";

    courseInfocard.appendChild(createElement("h2", {text: course.course}));
    if (course.name) courseInfocard.appendChild(createElement("div", {text: course.name}));

    const courseGrid = createElement("div", {class: "course-grid"});

    if (course.building) courseGrid.append(
        createElement("div", {text: "Building:"}),
        createElement("div", {text: course.building})
    );
    if (course.room) courseGrid.append(
        createElement("div", {text: "Room:"}),
        createElement("div", {text: course.room})
    );
    if (course.instructor) courseGrid.append(
        createElement("div", {text: "Instructor:"}),
        createElement("div", {text: course.instructor})
    );

    courseInfocard.append(
        document.createElement("br"),
        createElement("div", {text: formatCourseTime(course)}),
        createElement("div", {text: daysToStr(course.days)}),
        document.createElement("br"),
        courseGrid
    );

    courseInfocard.className = `config-screen ${course.color}`;

    showScreen(courseInfocard);
};

// build schedule infocard

const courseList = document.getElementById("courses-list");
const schedule = document.getElementById("schedule");
const scheduleList = document.getElementById("schedule-list");
const termList = document.getElementById("term-progress");

const getCurrentTerms = () => {
    const date = toUTC(selectedDate.getTime());

    return DATA.terms
        .filter(term => date >= term.start && date < term.end + DAY_MS);
};

const daysToMs = (days, time) => days * DAY_MS + time;

const buildSchedule = () => {
    const terms = getCurrentTerms();
    const termNames = terms.map(term => term.name);

    const courses = DATA.courses.filter(course => termNames.includes(course.term));
    const todayCourses = courses.filter(course => course.days.includes(selectedDate.getDay()));
    courses.sort((a, b) => a.startTime - b.startTime);
    todayCourses.sort((a, b) => daysToMs(a.days[0], a.startTime) - daysToMs(b.days[0], b.startTime));

    schedule.innerHTML = "";
    scheduleList.innerHTML = "";

    schedule.classList.toggle("break", isBreak);

    let prevTime = 0;
    for (const course of todayCourses) {
        const start = course.startTime / 60000 | 0;
        const end = course.endTime / 60000 | 0;

        if (start > prevTime) {
            const spacer = document.createElement("span");
            spacer.style.width = `${minutesToPx(start - prevTime)}px`;
            schedule.appendChild(spacer);
        }

        const courseElement = createElement("span", {class: `schedule-course ${course.color}`, text: course.course});
        courseElement.style.width = `${minutesToPx(end - start)}px`;
        schedule.appendChild(courseElement);

        courseElement.addEventListener("click", (e) => {
            showCourse(course);
            e.stopPropagation();
        });

        scheduleList.appendChild(createElement("div", {class: `tile schedule-tile ${course.color}`, children: [
            createElement("span", {text: course.course}),
            createElement("span", {text: formatCourseTime(course)})
        ]}));
    }


    // full list + terms

    const time = toUTC(selectedDate.getTime());

    courseList.innerHTML = "";
    termList.innerHTML = "";
    termList.classList.add("hidden");
    InputElement.CourseConfig.TERM.innerHTML = "";

    for (let i = 0; i < terms.length; i++) {
        const term = terms[i];

        const element = createElement("div", {class: "tile course-tile term-tile", children: [
            createElement("span", {text: term.name}),
            createElement("span", {text: `${shortDate(term.start)} - ${shortDate(term.end)}`})
        ]});

        element.addEventListener("click", () => showConfigScreen(ConfigScreen.EDIT_TERM, term, DATA.terms, i));

        courseList.appendChild(element);

        // term progress

        let termTime = time - term.start;
        let termLength = term.end - term.start;
        let termPercent = Math.floor(termTime / termLength * 100);

        const progressElement = createElement("div", {class: "tile course-tile term-tile", children: [
            createElement("span", {text: term.name}),
            createElement("span", {text: `${termPercent}% done`})
        ]});
        termList.appendChild(progressElement);

        const option = createElement("option", {text: term.name});
        option.value = term.name;
        InputElement.CourseConfig.TERM.appendChild(option);
    }

    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];

        const element = createElement("div", {class: `tile course-tile ${course.color}`, children: [
            createElement("span", {text: course.course}),
            createElement("span", {text: formatCourseTime(course)}),
            createElement("span", {text: course.term}),
            createElement("span", {text: daysToStr(course.days)}),
        ]});

        element.addEventListener("click", () => showConfigScreen(ConfigScreen.EDIT_COURSE, course, DATA.courses, i));

        courseList.appendChild(element);
    }

    EMPTY_COURSE.term = terms[0]?.name;
};

document.getElementById("show-term-progress").addEventListener("click", () => termList.classList.toggle("hidden"));

const currentTimeContainer = document.getElementById("current-time-container");

const setCurrentTime = () => {
    if (!todaySelected) {
        currentTimeContainer.style.visibility = "hidden";
        return;
    }

    const date = new Date();

    const time = date.getHours() * 60 + date.getMinutes();

    const left = minutesToPx(time) + 18;
    currentTimeContainer.style.left = `${left}px`;

    currentTimeContainer.style.visibility = "visible";
    UIElements.currentTimeText.textContent = date.toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit"}).replace(/[^0-9:]/g, "");

    if (todaySelected && date.getDate() > selectedDate.getDate())
        selectToday();

    return left;
};


scheduleContainer.addEventListener("click", () => showScreen(DataScreen.SCHEDULE_INFOCARD));

/* update displays */

// categories

const updateCategoryOptions = (input) => {
    input.innerHTML = "";

    for (const category of DATA.categories) {
        const option = createElement("option", {text: category.name, class: category.color});
        option.value = category.name;
        input.appendChild(option);
    }

    EMPTY_EVENT.category = DATA.categories[0].name;
    EMPTY_TASK.category = DATA.categories[0].name;
};
const showCategories = () => {
    categories.innerHTML = "";    
    for (let i = 0; i < DATA.categories.length; i++) {
        const category = DATA.categories[i];
        const element = createElement("div", {class: `tile category ${category.color}`, text: category.name});
        element.addEventListener("click", () => showConfigScreen(ConfigScreen.EDIT_CATEGORY, category, DATA.categories, i));
        categories.appendChild(element);
    }

    updateCategoryOptions(InputElement.EventConfig.CATEGORY);
    updateCategoryOptions(InputElement.TaskConfig.CATEGORY);

    updateEvents();
    updateTasks();
};

// terms/courses



// events

const eventsContainer = document.getElementById("events");
const imTasksContainer = document.getElementById("tasks");
const unTasksContainer = document.getElementById("tasks-unimportant");

const parseDatetime = (datetime) => {
    if (datetime.allDay) {
        return toUTC(datetime.time);
    }

    const fixedDate = new Date(datetime.time);
    fixedDate.setHours(0, 0, 0, 0);
    return fixedDate.getTime();
}; 

const updateEvents = () => {
    eventsContainer.innerHTML = "";
    isBreak = false;

    const time = selectedDate.getTime();
    const events = DATA.events.filter((event) =>
        time >= parseDatetime(event.start) &&
        time < (parseDatetime(event.end !== null ? event.end : event.start) + DAY_MS)
    );

    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const category = DATA.categories.find(category => category.name === event.category);

        const element = createElement("div", {class: `tile event ${category.color}`});

        const name = createElement("div", {class: "tile-title", text: event.name});
        if (event.break) {
            isBreak = true;
            name.appendChild(createElement("span", {class: "break-text", text: " (No Classes)"}));
        }
        element.appendChild(name);

        if (event.note.length > 0)
            element.appendChild(createElement("div", {text: event.note}));

        let startTime = event.start.allDay ? toUTC(event.start.time) : event.start.time;
        let dateStr = shortDatetime(startTime, !event.start.allDay);
        if (event.end !== null) {
            let endTime = event.end.allDay ? toUTC(event.end.time) : event.end.time;
            let startDate = new Date(startTime);
            let endDate = new Date(endTime);
            if (
                startDate.getFullYear() === endDate.getFullYear() &&
                startDate.getMonth() === endDate.getMonth() &&
                startDate.getDate() === endDate.getDate()
            ) dateStr += " - " + endDate.toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit"});
            else dateStr += " - " + shortDatetime(endTime, !event.end.allDay);
        }
        element.appendChild(createElement("div", {text: dateStr}));

        element.addEventListener("click", () => showConfigScreen(ConfigScreen.EDIT_EVENT, event, DATA.events, i));

        eventsContainer.appendChild(element);
    }

    buildSchedule();
};

const createTask = (task) => {
    const header = createElement("div", {class: "tile-info", children: [
        createElement("div", {class: "tile-title", text: task.name})
    ]});

    if (task.note.length > 0)
        header.appendChild(createElement("div", {text: task.note}));

    if (task.end !== null) {
        const allDay = task.end.allDay;
        let endTime = allDay ? toUTC(task.end.time) : task.end.time;
        const endText = shortDatetime(endTime, !allDay);
        if (allDay) endTime += DAY_MS;
        header.appendChild(createElement("div", {class: Date.now() > endTime ? "overdue" : undefined, text: "Due " + endText}));
    }

    const complete = createElement("button", {class: "pebble clear-task", text: "\u2713"});

    const container = createElement("div", {class: "tile task", children: [
        header,
        complete
    ]});

    if (task.completed) container.classList.add("completed");

    return {container, complete};
};

const showCompletedTasks = () => UIElements.showCompletedTasks.classList.contains("active");

const setCompleted = (element, completed) => element.container.classList.toggle("completed", completed);

const enableTaskCompletion = (element, task) => {
    element.complete.addEventListener("click", (e) => {
        e.stopPropagation();
        task.completed = !task.completed;
        if (task.completed && !showCompletedTasks()) element.container.remove();
        else updateTasks();
    });
};

const updateTasks = () => {
    imTasksContainer.innerHTML = "";
    unTasksContainer.innerHTML = "";

    const time = selectedDate.getTime();

    const showCompleted = showCompletedTasks();

    for (let i = 0; i < DATA.tasks.length; i++) {
        const task = DATA.tasks[i];

        if ((task.start !== null && time < parseDatetime(task.start)) || (task.completed && !showCompleted))
            continue;

        const category = DATA.categories.find(category => category.name === task.category);

        const taskElement = createTask(task);
        taskElement.container.classList.add(category.color);

        enableTaskCompletion(taskElement, task);

        for (let k = 0; k < task.subtasks.length; k++) {
            const subtask = task.subtasks[k];
            if (subtask.completed && !showCompleted) continue;

            const subtaskElement = createTask(subtask);

            enableTaskCompletion(subtaskElement, subtask);

            taskElement.container.appendChild(subtaskElement.container);
        }

        taskElement.container.addEventListener("click", () => showConfigScreen(ConfigScreen.EDIT_TASK, task, DATA.tasks, i));

        const container = task.unimportant ? unTasksContainer : imTasksContainer;
        container.appendChild(taskElement.container);
    }
};

const reloadDay = () => {
    showDate();
    updateEvents();
    updateTasks();
    if (todaySelected) scheduleContainer.scroll(setCurrentTime() - 64, 0);
    calendarInput.valueAsNumber = toUTC(selectedDate.getTime());
};

const reloadData = () => {
    showCategories();
    reloadDay();
};

UIElements.showCompletedTasks.addEventListener("click", updateTasks);