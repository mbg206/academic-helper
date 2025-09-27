const DEFAULT_DATA = {
    terms: [],
    courses: [],
    categories: [
        {
            name: "School",
            color: "color4"
        },
        {
            name: "Personal",
            color: "color6"
        },
        {
            name: "Holiday",
            color: "color2"
        }
    ],
    events: [],
    tasks: [],
    theme: "light"
};

const loadData = localStorage.getItem("app-data");
const DATA = loadData === null ? DEFAULT_DATA : JSON.parse(loadData);

const EMPTY_TERM = {name: "", start: null, end: null};
const EMPTY_COURSE = {course: "", name: "", building: "", room: "", instructor: "", startTime: null, endTime: null, days: [], term: "", color: "color6"};
const EMPTY_CATEGORY = {name: "", color: "color3"};
const EMPTY_EVENT = {name: "", note: "", start: null, end: null, category: "", break: false};
const EMPTY_TASK = {name: "", note: "", start: null, end: null, subtasks: [], category: "", unimportant: false, completed: false};
const EMPTY_SUBTASK = {name: "", note: "", end: null, completed: false};

const sortArray = (arr) => {
    if (arr === DATA.events) {
        DATA.events.sort((a, b) => a.start.time - b.start.time);
    }
    else if (arr === DATA.tasks) {
        DATA.tasks.sort((a, b) =>
            (a.end === null ? Number.MAX_SAFE_INTEGER : a.end.time) -
            (b.end === null ? Number.MAX_SAFE_INTEGER : b.end.time)
        );
        DATA.tasks.sort((a, b) => a.completed - b.completed);
    }
};


const saveData = () => {
    try {
        localStorage.setItem("app-data", JSON.stringify(DATA));
    }
    catch (e) {
        alert("An error has occurred trying to save data!");
    }
};

if (loadData === null) saveData();

navigator.storage.persist();


const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "application/json";

document.getElementById("upload-data").addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
    if (fileInput.files.length === 0) return;
    const file = fileInput.files[0];

    const reader = new FileReader();

    reader.addEventListener("load", () => {
        try {
            const newData = JSON.parse(reader.result);
            Object.keys(newData).forEach(key => {
                if (!DATA.hasOwnProperty(key)) throw new Error("invalid input data");
            });
            Object.assign(DATA, newData);
            saveData();
            reloadData();
        }
        catch (e) {
            console.error(e);
            alert("Couldn't load new data!");
        }
    });

    reader.readAsText(file);
});

document.getElementById("download-data").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(DATA)]);
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.download = "academic-helper-data.json";
    anchor.href = url;
    anchor.click();

    URL.revokeObjectURL(url);
});