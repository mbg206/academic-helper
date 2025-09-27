const themeSwitcher = document.getElementById("theme");
themeSwitcher.value = DATA.theme;

const mediaMatch = window.matchMedia("(prefers-color-scheme: dark)");
let systemDarkTheme = mediaMatch.matches;
mediaMatch.addEventListener("change", (e) => systemDarkTheme = e.matches);

const updateTheme = () => {
    let theme;
    if (themeSwitcher.value === "system") {
        theme = systemDarkTheme ? "dark" : "light";
    }
    else theme = themeSwitcher.value;

    document.body.className = theme;
};

updateTheme();
themeSwitcher.addEventListener("input", () => {
    updateTheme();
    DATA.theme = themeSwitcher.value;
    saveData();
});


selectToday();
showCategories();

setInterval(setCurrentTime, 1000);

navigator.serviceWorker.register("../worker.js").then(console.log);