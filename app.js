const SUPABASE_URL = "https://wgdobsjrmcxsehvhwyer.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qErSzylqcBJbAv2-pf9diQ_8_PtLVuO";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let activities = [];
let rewards = [];
let categories = [];
let selectedReward = "";

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function showError(message, error) {
  console.error(message, error);
  alert(message + "\n\nCheck Console for details.");
}

async function loadData() {
  await Promise.all([
    loadActivities(),
    loadRewards(),
    loadCategories(),
    loadAppState()
  ]);

  renderAll();
}

async function loadActivities() {
  const { data, error } = await db
    .from("activities")
    .select("id, person, category, task, score, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    showError("Failed to load activities from Supabase.", error);
    return;
  }

  activities = data || [];
}

async function loadRewards() {
  const { data, error } = await db
    .from("rewards")
    .select("id, title, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    showError("Failed to load rewards from Supabase.", error);
    return;
  }

  rewards = data || [];
}

async function loadCategories() {
  const { data, error } = await db
    .from("categories")
    .select("id, name, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    showError("Failed to load categories from Supabase.", error);
    return;
  }

  categories = data || [];
}

async function loadAppState() {
  const { data, error } = await db
    .from("app_state")
    .select("id, selected_reward, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load app_state:", error);
    selectedReward = "";
    return;
  }

  selectedReward = data?.selected_reward || "";
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

  if (!categorySelect) return;

  categorySelect.innerHTML = "";

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
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

  if (!list) return;

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
                ${escapeHTML(activity.person)} • ${escapeHTML(activity.category)} • ${formatDate(activity.created_at)}
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

  if (!rewardList || !selectedRewardText) return;

  if (rewards.length === 0) {
    rewardList.innerHTML = `<div class="empty">No rewards yet. Add your first reward.</div>`;
  } else {
    rewardList.innerHTML = rewards
      .map((reward) => {
        return `
          <div class="reward">
            <span>${escapeHTML(reward.title)}</span>
            <div class="reward-actions">
              <button onclick="selectRewardById('${reward.id}')">Choose</button>
              <button class="delete-btn" onclick="deleteReward('${reward.id}')">Delete</button>
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

  if (!container) return;

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

async function addActivity() {
  const person = document.getElementById("person").value;
  const category = document.getElementById("category").value;
  const task = document.getElementById("task").value.trim();
  const score = Number(document.getElementById("score").value);

  if (!person || !category || !task || !score || score <= 0) {
    alert("Please fill in person, category, task title, and a valid score.");
    return;
  }

  const { data, error } = await db
    .from("activities")
    .insert([
      {
        person,
        category,
        task,
        score
      }
    ])
    .select();

  if (error) {
    showError("Failed to add activity.", error);
    return;
  }

  console.log("Activity inserted:", data);

  document.getElementById("task").value = "";
  document.getElementById("score").value = "";

  await loadData();
}

async function deleteActivity(id) {
  const confirmed = confirm("Delete this activity?");

  if (!confirmed) return;

  const { error } = await db
    .from("activities")
    .delete()
    .eq("id", id);

  if (error) {
    showError("Failed to delete activity.", error);
    return;
  }

  await loadData();
}

async function addCategory() {
  const input = document.getElementById("new-category");
  const value = input.value.trim();

  if (!value) {
    alert("Please enter a category name.");
    return;
  }

  const exists = categories.some(
    (category) => category.name.toLowerCase() === value.toLowerCase()
  );

  if (exists) {
    alert("This category already exists.");
    return;
  }

  const { error } = await db
    .from("categories")
    .insert([{ name: value }]);

  if (error) {
    showError("Failed to add category.", error);
    return;
  }

  input.value = "";
  await loadData();
}

async function addReward() {
  const input = document.getElementById("reward-input");
  const value = input.value.trim();

  if (!value) {
    alert("Please enter a reward.");
    return;
  }

  const { error } = await db
    .from("rewards")
    .insert([{ title: value }]);

  if (error) {
    showError("Failed to add reward.", error);
    return;
  }

  input.value = "";
  await loadData();
}

async function deleteReward(id) {
  const confirmed = confirm("Delete this reward?");

  if (!confirmed) return;

  const { error } = await db
    .from("rewards")
    .delete()
    .eq("id", id);

  if (error) {
    showError("Failed to delete reward.", error);
    return;
  }

  await loadData();
}

async function selectRewardById(id) {
  const reward = rewards.find((item) => item.id === id);

  if (!reward) {
    alert("Reward not found.");
    return;
  }

  await selectReward(reward.title);
}

async function selectReward(rewardTitle) {
  selectedReward = rewardTitle;

  const { error } = await db
    .from("app_state")
    .update({
      selected_reward: selectedReward,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) {
    showError("Failed to select reward.", error);
    return;
  }

  await loadData();
}

async function pickRandomReward() {
  if (rewards.length === 0) {
    alert("No rewards available. Please add at least one reward.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * rewards.length);
  const rewardTitle = rewards[randomIndex].title;

  await selectReward(rewardTitle);
}

async function resetWeek() {
  const scores = calculateScores();
  const result = getWinner(scores);

  let message = "Start a new week? This will delete this week's activities.";

  if (result.winner && result.winner !== "Tie") {
    message = `${result.winner} is the weekly winner. Start a new week? This will delete this week's activities.`;
  }

  const confirmed = confirm(message);

  if (!confirmed) return;

  const { error: deleteError } = await db
    .from("activities")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    showError("Failed to reset activities.", deleteError);
    return;
  }

  const { error: stateError } = await db
    .from("app_state")
    .update({
      selected_reward: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (stateError) {
    showError("Activities were reset, but selected reward could not be cleared.", stateError);
    return;
  }

  await loadData();
}

function setupRealtime() {
  db.channel("study-duel-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "activities" },
      async () => {
        await loadData();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rewards" },
      async () => {
        await loadData();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "categories" },
      async () => {
        await loadData();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_state" },
      async () => {
        await loadData();
      }
    )
    .subscribe();
}

window.setScore = setScore;
window.addActivity = addActivity;
window.deleteActivity = deleteActivity;
window.addCategory = addCategory;
window.addReward = addReward;
window.deleteReward = deleteReward;
window.selectRewardById = selectRewardById;
window.pickRandomReward = pickRandomReward;
window.resetWeek = resetWeek;

loadData();
setupRealtime();
