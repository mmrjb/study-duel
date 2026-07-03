const SUPABASE_URL = "https://wgdobsjrmcxsehvhwyer.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qErSzylqcBJbAv2-pf9diQ_8_PtLVuO";
const STORAGE_KEYS = {
  activities: "studyDuel.activities",
  rewards: "studyDuel.rewards",
  categories: "studyDuel.categories",
  selectedReward: "studyDuel.selectedReward"
};

const USERS = ["Mohammadmahdi", "Bahar"];

const DEFAULT_CATEGORIES = [
  "IELTS",
  "DevOps",
  "Linux",
  "Docker",
  "Kubernetes",
  "Migration",
  "Gym",
  "Diet",
  "Other"
];

const DEFAULT_REWARDS = [
  "Cafe",
  "Dinner",
  "Movie night",
  "Ice cream",
  "Book shopping",
  "Winner chooses the Friday plan",
  "A full rest evening",
  "Pizza night",
  "Walking date",
  "Small gift"
];

let activities = loadFromStorage(STORAGE_KEYS.activities, []);
let rewards = loadFromStorage(STORAGE_KEYS.rewards, DEFAULT_REWARDS);
let categories = loadFromStorage(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
let selectedReward = loadFromStorage(STORAGE_KEYS.selectedReward, "");

function loadFromStorage(key, fallback) {
  const data = localStorage.getItem(key);

  if (!data) {
    return fallback;
  }

  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(activities));
  localStorage.setItem(STORAGE_KEYS.rewards, JSON.stringify(rewards));
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  localStorage.setItem(STORAGE_KEYS.selectedReward, JSON.stringify(selectedReward));
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function calculateScores() {
  const scores = {
    Mohammadmahdi: 0,
    Bahar: 0
  };

  activities.forEach((activity) => {
    if (scores[activity.person] !== undefined) {
      scores[activity.person] += Number(activity.score) || 0;
    }
  });

  return scores;
}

function getWinner(scores) {
  if (scores.Mohammadmahdi === 0 && scores.Bahar === 0) {
    return {
      winner: null,
      text: "No activity has been added yet.",
      difference: 0
    };
  }

  if (scores.Mohammadmahdi > scores.Bahar) {
    return {
      winner: "Mohammadmahdi",
      text: "Mohammadmahdi is leading this week 🔥",
      difference: scores.Mohammadmahdi - scores.Bahar
    };
  }

  if (scores.Bahar > scores.Mohammadmahdi) {
    return {
      winner: "Bahar",
      text: "Bahar is leading this week 🔥",
      difference: scores.Bahar - scores.Mohammadmahdi
    };
  }

  return {
    winner: "Tie",
    text: "It is a tie right now 🤝",
    difference: 0
  };
}

function renderCategories() {
  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = "";

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function renderDashboard() {
  const scores = calculateScores();
  const result = getWinner(scores);

  document.getElementById("score-me").textContent = `${scores.Mohammadmahdi} points`;
  document.getElementById("score-bahar").textContent = `${scores.Bahar} points`;
  document.getElementById("winner-text").textContent = result.text;
  document.getElementById("difference-text").textContent = `Difference: ${result.difference} points`;

  const finalWinner = document.getElementById("final-winner");
  const finalScore = document.getElementById("final-score");

  if (!result.winner) {
    finalWinner.textContent = "Winner: -";
    finalScore.textContent = "No result yet.";
  } else if (result.winner === "Tie") {
    finalWinner.textContent = "Winner: Tie";
    finalScore.textContent = `${scores.Mohammadmahdi} - ${scores.Bahar}`;
  } else {
    finalWinner.textContent = `Winner: ${result.winner}`;
    finalScore.textContent = `Mohammadmahdi: ${scores.Mohammadmahdi} | Bahar: ${scores.Bahar}`;
  }
}

function renderActivities() {
  const list = document.getElementById("activity-list");

  if (activities.length === 0) {
    list.innerHTML = `<div class="empty">No activity has been added this week.</div>`;
    return;
  }

  list.innerHTML = activities
    .map((activity) => {
      return `
        <div class="activity">
          <div class="activity-top">
            <div>
              <h3>${escapeHTML(activity.task)}</h3>
              <p class="meta">
                ${escapeHTML(activity.person)} • ${escapeHTML(activity.category)} • ${formatDate(activity.date)}
              </p>
            </div>
            <span class="score-pill">+${Number(activity.score)} pts</span>
          </div>

          <button class="delete-btn" onclick="deleteActivity('${activity.id}')">Delete</button>
        </div>
      `;
    })
    .join("");
}

function renderRewards() {
  const rewardList = document.getElementById("reward-list");
  const selectedRewardText = document.getElementById("selected-reward");

  if (rewards.length === 0) {
    rewardList.innerHTML = `<div class="empty">No rewards yet. Add your first reward.</div>`;
  } else {
    rewardList.innerHTML = rewards
      .map((reward, index) => {
        return `
          <div class="reward">
            <span>${escapeHTML(reward)}</span>
            <div class="reward-actions">
              <button onclick="selectReward('${escapeHTML(reward)}')">Choose</button>
              <button class="delete-btn" onclick="deleteReward(${index})">Delete</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  if (selectedReward) {
    selectedRewardText.textContent = `Selected reward: ${selectedReward}`;
  } else {
    selectedRewardText.textContent = "";
  }
}

function renderCategorySummary() {
  const summary = {};
  const container = document.getElementById("category-summary");

  activities.forEach((activity) => {
    if (!summary[activity.category]) {
      summary[activity.category] = 0;
    }

    summary[activity.category] += Number(activity.score) || 0;
  });

  const entries = Object.entries(summary).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    container.innerHTML = `<div class="empty">No category data yet.</div>`;
    return;
  }

  container.innerHTML = entries
    .map(([category, score]) => {
      return `
        <div class="summary-item">
          <span>${escapeHTML(category)}</span>
          <strong>${score} pts</strong>
        </div>
      `;
    })
    .join("");
}

function renderAll() {
  renderCategories();
  renderDashboard();
  renderActivities();
  renderRewards();
  renderCategorySummary();
}

function setScore(value) {
  document.getElementById("score").value = value;
}

function addActivity() {
  const person = document.getElementById("person").value;
  const category = document.getElementById("category").value;
  const task = document.getElementById("task").value.trim();
  const score = Number(document.getElementById("score").value);

  if (!person || !category || !task || !score || score <= 0) {
    alert("Please fill in person, category, task title, and a valid score.");
    return;
  }

  const activity = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    person,
    category,
    task,
    score,
    date: new Date().toISOString()
  };

  activities.unshift(activity);

  document.getElementById("task").value = "";
  document.getElementById("score").value = "";

  saveData();
  renderAll();
}

function deleteActivity(id) {
  const confirmed = confirm("Delete this activity?");

  if (!confirmed) {
    return;
  }

  activities = activities.filter((activity) => activity.id !== id);

  saveData();
  renderAll();
}

function addCategory() {
  const input = document.getElementById("new-category");
  const value = input.value.trim();

  if (!value) {
    alert("Please enter a category name.");
    return;
  }

  const exists = categories.some(
    (category) => category.toLowerCase() === value.toLowerCase()
  );

  if (exists) {
    alert("This category already exists.");
    return;
  }

  categories.push(value);
  input.value = "";

  saveData();
  renderAll();
}

function addReward() {
  const input = document.getElementById("reward-input");
  const value = input.value.trim();

  if (!value) {
    alert("Please enter a reward.");
    return;
  }

  rewards.push(value);
  input.value = "";

  saveData();
  renderAll();
}

function deleteReward(index) {
  const confirmed = confirm("Delete this reward?");

  if (!confirmed) {
    return;
  }

  rewards.splice(index, 1);

  saveData();
  renderAll();
}

function selectReward(reward) {
  selectedReward = reward;

  saveData();
  renderAll();
}

function pickRandomReward() {
  if (rewards.length === 0) {
    alert("No rewards available. Please add at least one reward.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * rewards.length);
  selectedReward = rewards[randomIndex];

  saveData();
  renderAll();
}

function resetWeek() {
  const scores = calculateScores();
  const result = getWinner(scores);

  let message = "Start a new week? This will delete this week's activities.";

  if (result.winner && result.winner !== "Tie") {
    message = `${result.winner} is the weekly winner. Start a new week? This will delete this week's activities.`;
  }

  const confirmed = confirm(message);

  if (!confirmed) {
    return;
  }

  activities = [];
  selectedReward = "";

  saveData();
  renderAll();
}

renderAll();
