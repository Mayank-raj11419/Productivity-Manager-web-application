const nav1 = document.getElementById("nav-ul-1");
const nav2 = document.getElementById("nav-ul-2");

const upcomingList = document.getElementById("upcomingList");
const todayList = document.getElementById("TodayList");
const pendingList = document.getElementById("pendingList");

const total = document.querySelector(".Total-task span:last-child");
const pendingCount = document.querySelector(".pending-task span:last-child");
const upcomingCount = document.querySelector(".Running-task span:last-child");
const todayCount = document.querySelector(".Ended-task span:last-child");

const contextMenu = document.getElementById("context-menu");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentIndex = null;

/* ---------------- NAVIGATION ---------------- */

const add_task = document.getElementsByClassName("home-heading-1st-3rd")[0];

add_task.addEventListener("click", () => {
    const current = document.querySelector('input[name="nav-check"]:checked');
    if (current) current.checked = false;

    document.getElementById("Add-nav").checked = true;
    handleNavChange();
});

function handleNavChange() {
    const selected = document.querySelector('input[name="nav-check"]:checked');
    if (!selected) return;

    document.querySelectorAll(
        "#home-sec, #upcoming-tasks-sec, #today-tasks-sec, #pending-tasks-sec, #add-task, #contact-sec, #edit-task-sec, #setting-sec, #about-sec"
    ).forEach(sec => sec.style.display = "none");

    let id = selected.parentElement.textContent.trim();

    if (id === "Add Task") {
        id = "add-task";
    } else {
        id = id.toLowerCase().replace(/\s+/g, "-") + "-sec";
    }

    const change = document.getElementById(id);
    if (change) change.style.display = "flex";
}

nav1?.addEventListener("change", handleNavChange);
nav2?.addEventListener("change", handleNavChange);

/* ---------------- ADD TASK ---------------- */

document.getElementById("Add-task").addEventListener("submit", e => {
    e.preventDefault();

    const taskName = document.getElementById("task").value;
    const taskDate = document.getElementById("date").value;
    const taskUrgency = document.getElementById("urg-op").value;
    const taskImportance = document.getElementById("imp-op").value;

    tasks.push({
        name: taskName,
        date: taskDate,
        urgency: taskUrgency,
        importance: taskImportance,
        completed: false
    });

    saveAndRender();
    e.target.reset();
});

/* ---------------- CONTEXT MENU ---------------- */

document.addEventListener("click", () => {
    if (contextMenu) contextMenu.style.display = "none";
});

function showMenu(x, y) {
    if (!contextMenu) return;
    contextMenu.style.display = "flex";
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
}

/* ---------------- ACTIONS ---------------- */

window.deleteTask = () => {
    if (currentIndex !== null) {
        tasks.splice(currentIndex, 1);
        saveAndRender();
    }
};

window.toggleComplete = () => {
    if (currentIndex !== null) {
        tasks[currentIndex].completed = !tasks[currentIndex].completed;
        saveAndRender();
    }
};

window.aboutTask = () => {
    if (currentIndex !== null) {
        const t = tasks[currentIndex];
        alert(
`Task Details:

Title: ${t.name}
Date: ${t.date}
Urgency: ${t.urgency}
Importance: ${t.importance}
Status: ${t.completed ? "Completed" : "Pending"}`
        );
    }
};


window.editTask = function () {
    if (currentIndex === null) return;

    const task = tasks[currentIndex];

    // Fill edit form
    document.getElementById("edit-task-title").textContent = task.name;
    document.getElementById("edit-date").value = task.date;
    document.getElementById("edit-urg").value = task.urgency;
    document.getElementById("edit-imp").value = task.importance;

    // Hide all sections
    document.querySelectorAll(
        "#home-sec, #upcoming-tasks-sec, #today-tasks-sec, #pending-tasks-sec, #add-task, #contact-sec, #setting-sec, #about-sec"
    ).forEach(sec => sec.style.display = "none");

    // Show edit section
    document.getElementById("edit-task-sec").style.display = "flex";

    // Hide context menu
    contextMenu.style.display = "none";
};



document.getElementById("Edit-task-form").addEventListener("submit", function (e) {
    e.preventDefault();

    if (currentIndex === null) return;

    tasks[currentIndex].date = document.getElementById("edit-date").value;
    tasks[currentIndex].urgency = document.getElementById("edit-urg").value;
    tasks[currentIndex].importance = document.getElementById("edit-imp").value;

    saveAndRender();

    document.getElementById("edit-task-sec").style.display = "none";
    document.getElementById("home-sec").style.display = "flex";
});

document.getElementById("cancel-edit").addEventListener("click", function () {
    document.getElementById("edit-task-sec").style.display = "none";
    document.getElementById("home-sec").style.display = "flex";
});


/* ---------------- RENDER ---------------- */

function render() {

    const today = new Date().toISOString().split("T")[0];

    upcomingList.innerHTML = "";
    pendingList.innerHTML = "";
    todayList.innerHTML = "";

    let p = 0, u = 0, c = 0;

    tasks.forEach((t, i) => {

        const li = document.createElement("li");
        li.textContent = `${t.name} - ${t.date}`;

        if (t.completed) li.classList.add("completed");

        li.addEventListener("contextmenu", e => {
            e.preventDefault();
            currentIndex = i;
            showMenu(e.pageX, e.pageY);
        });

        if (!t.completed) {
            if (t.date === today) {
                todayList.appendChild(li);
                c++;
            } 
            else if (t.date > today) {
                upcomingList.appendChild(li);
                u++;
            } 
            else {
                pendingList.appendChild(li);
                p++;
            }
        }
    });

    total.textContent = tasks.length;
    pendingCount.textContent = p;
    upcomingCount.textContent = u;
    todayCount.textContent = c;

    /* ================= DASHBOARD ================= */

    /* ---------- Analytics (Today + Pending Only) ---------- */

    let activeTasks = tasks.filter(t => t.date <= today);  
    // includes today + past (pending)

    let completedActive = activeTasks.filter(t => t.completed).length;

    let analyticsPercent = activeTasks.length === 0 ? 0 :
        Math.round((completedActive / activeTasks.length) * 100);

    const percentEl = document.getElementById("analytics-percent");
    if (percentEl) percentEl.textContent = analyticsPercent + "%";

    let deg = (analyticsPercent / 100) * 180;

    const semiCircle = document.querySelector(".semi-circle");
    if (semiCircle) {
        semiCircle.style.background =
            `conic-gradient(
                var(--accent-gold) 0deg,
                var(--accent-gold) ${deg}deg,
                var(--dark-main) ${deg}deg
            )`;
    }

    /* ---------- Urgent Tasks ---------- */

    let urgentTasks = tasks
        .filter(t => !t.completed && t.date <= today)
        .sort((a, b) => {
            if (Number(b.urgency) !== Number(a.urgency))
                return Number(b.urgency) - Number(a.urgency);
            return new Date(b.date) - new Date(a.date);
        })
        .slice(0, 3);

    const urgentList = document.getElementById("urgent-list");
    if (urgentList) {
        urgentList.innerHTML = "";

        urgentTasks.forEach(t => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${t.name}</span>
                <span class="priority-badge">U${t.urgency}</span>
            `;
            urgentList.appendChild(li);
        });
    }

    /* ---------- Today Progress ---------- */

    let completedToday = tasks.filter(t => t.date === today && t.completed).length;
    let totalToday = tasks.filter(t => t.date === today).length;

    let progressPercent = totalToday === 0 ? 0 :
        Math.round((completedToday / totalToday) * 100);

    const progressText = document.getElementById("today-progress-percent");
    const progressFill = document.getElementById("today-progress-fill");

    if (progressText) progressText.textContent = progressPercent + "%";
    if (progressFill) progressFill.style.width = progressPercent + "%";

    /* ---------- Priority Tasks ---------- */

    let priorityTasks = tasks
        .filter(t => !t.completed && t.date <= today)
        .map(t => ({
            ...t,
            score: Number(t.urgency) + Number(t.importance)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

    const priorityList = document.getElementById("priority-list");
    if (priorityList) {
        priorityList.innerHTML = "";

        priorityTasks.forEach(t => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${t.name}</span>
                <span class="priority-badge">${t.score}</span>
            `;
            priorityList.appendChild(li);
        });
    }
}


function saveAndRender() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    render();
}

/* ---------------- INIT ---------------- */

render();



/* ================= HAMBURGER ================= */

const hamburger = document.getElementById("hamburger");
const navSec = document.getElementById("nav-sec");

hamburger.addEventListener("click", () => {
    navSec.classList.toggle("active");
});

/* Close nav when clicking a nav item (mobile only) */
document.querySelectorAll('#nav-sec input[name="nav-check"]').forEach(input => {
    input.addEventListener("change", () => {
        if (window.innerWidth <= 700) {
            navSec.classList.remove("active");
        }
    });
});
