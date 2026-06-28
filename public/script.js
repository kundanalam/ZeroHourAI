// =====================
// NAVIGATION
// =====================
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const btns = document.querySelectorAll('.nav-btn');
  const map = { chat: 0, deadlines: 1, habits: 2 };
  btns[map[id]].classList.add('active');
}

// =====================
// AI CHAT
// =====================
async function callGemini(prompt) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    if (data.reply) return data.reply;
    throw new Error('No reply');
  } catch (err) {
    const msg = prompt.toLowerCase();
    if (msg.includes('exam') || msg.includes('test') || msg.includes('viva') || msg.includes('study')) {
      return `⚡ Exam crunch mode — let's go!\n\n1. 📝 List ALL topics right now — spend just 5 mins\n2. 🎯 Focus ONLY on high-weightage chapters first\n3. ⏱️ Study in 25-min bursts with 5-min breaks\n4. 📖 Revise notes instead of re-reading everything\n5. 💤 Sleep at least 6 hours — your brain needs it!\n\nStart with Step 1 RIGHT NOW. You've got this! 💪`;
    }
    if (msg.includes('assignment') || msg.includes('submit') || msg.includes('deadline')) {
      return `🚀 Assignment crunch mode!\n\n1. ✍️ Open the document RIGHT NOW\n2. 📋 Write a rough outline in 10 minutes\n3. 🎯 Complete one section at a time\n4. ⏰ Set a timer for each section\n5. 🔍 Quick proofread at the end\n\nDone is better than perfect. Start NOW! ⚡`;
    }
    if (msg.includes('interview') || msg.includes('job')) {
      return `💼 Interview prep — fast mode!\n\n1. 🔍 Research the company in 15 mins\n2. 📝 Prepare answers for top 5 questions\n3. 👔 Pick your outfit RIGHT NOW\n4. 🗺️ Check the location/link in advance\n5. 😴 Sleep well — confidence comes from rest!\n\nYou've got this! 🌟`;
    }
    if (msg.includes('stress') || msg.includes('panic') || msg.includes('overwhelm')) {
      return `🌟 Breathe. You've got this!\n\n1. 😮‍💨 Take 3 deep breaths RIGHT NOW\n2. 📝 Write down everything stressing you\n3. 🎯 Pick just ONE thing to tackle first\n4. ⏱️ Work on it for just 10 minutes\n5. 🏆 Celebrate each small win!\n\nOne step at a time! 💙`;
    }
    return `⚡ ZeroHour AI here!\n\n1. 🎯 Break your task into 3 smaller steps\n2. ⏱️ Start the most urgent part RIGHT NOW\n3. 📵 Phone on silent for 25 minutes\n4. ✅ Complete one step before the next\n5. 🏆 You're closer than you think!\n\nStop planning, start doing — GO! 💪`;
  }
}

function appendMessage(text, type) {
  const chatBox = document.getElementById('chatBox');
  const div = document.createElement('div');
  div.className = `message ${type}`;
  div.innerHTML = `<span>${text.replace(/\n/g, '<br>')}</span>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const userText = input.value.trim();
  if (!userText) return;
  appendMessage(userText, 'user-message');
  input.value = '';
  const typing = appendMessage('⚡ ZeroHour AI is thinking...', 'typing-indicator');
  const prompt = `You are ZeroHour AI, an expert productivity coach helping people beat deadlines and stress.

User's situation: "${userText}"

Respond with:
🎯 One empathetic opening line
📋 A numbered action plan (3-5 steps) they can start IMMEDIATELY
⚡ One powerful motivating closing line

Be specific, energetic, and practical. Use emojis. Keep it under 150 words.`;
  try {
    const reply = await callGemini(prompt);
    typing.remove();
    appendMessage(reply, 'ai-message');
  } catch (err) {
    typing.remove();
    appendMessage('Something went wrong. Please try again!', 'ai-message');
  }
}

// =====================
// DEADLINE TRACKER
// =====================
function loadTasks() {
  return JSON.parse(localStorage.getItem('zerohour_tasks') || '[]');
}

function saveTasks(tasks) {
  localStorage.setItem('zerohour_tasks', JSON.stringify(tasks));
}

function getUrgency(deadline) {
  const hoursLeft = (new Date(deadline) - new Date()) / (1000 * 60 * 60);
  if (hoursLeft < 0) return { label: '🔴 Overdue', cls: 'urgency-overdue' };
  if (hoursLeft <= 6) return { label: '🔴 Critical', cls: 'urgency-critical' };
  if (hoursLeft <= 24) return { label: '🟡 Due Soon', cls: 'urgency-soon' };
  return { label: '🟢 On Track', cls: 'urgency-relaxed' };
}

function formatDeadline(deadline) {
  const due = new Date(deadline);
  const hoursLeft = Math.round((due - new Date()) / (1000 * 60 * 60));
  const dateStr = due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (hoursLeft < 0) return `${dateStr} (Overdue by ${Math.abs(hoursLeft)}h)`;
  if (hoursLeft < 24) return `${dateStr} (${hoursLeft}h left)`;
  return `${dateStr} (${Math.round(hoursLeft / 24)} days left)`;
}

function addTask() {
  const name = document.getElementById('taskName').value.trim();
  let deadline = document.getElementById('taskDeadline').value;
  const category = document.getElementById('taskCategory').value;
  if (!name || !deadline) { alert('Please enter both task name and deadline!'); return; }
  if (deadline.length === 10) deadline = deadline + 'T23:59';
  const tasks = loadTasks();
  tasks.push({ id: Date.now(), name, deadline, category, completed: false });
  saveTasks(tasks);
  document.getElementById('taskName').value = '';
  document.getElementById('taskDeadline').value = '';
  renderTasks();
}

function toggleTask(id) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === id);
  if (task) task.completed = !task.completed;
  saveTasks(tasks);
  renderTasks();
}

function deleteTask(id) {
  saveTasks(loadTasks().filter(t => t.id !== id));
  renderTasks();
}

function renderTasks() {
  const tasks = loadTasks();
  const container = document.getElementById('taskList');
  if (tasks.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fa fa-clock"></i><br>No tasks yet. Add one above!</div>`;
    return;
  }

  // Sort: incomplete first by deadline, completed at bottom
  tasks.sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  container.innerHTML = tasks.map(task => {
    const urgency = task.completed ? { label: '✅ Done', cls: 'urgency-relaxed' } : getUrgency(task.deadline);
    return `
      <div class="task-card ${task.completed ? 'task-done' : ''}">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})">
          ${task.completed ? '✓' : ''}
        </div>
        <div class="task-info">
          <div class="task-name" style="${task.completed ? 'text-decoration:line-through;opacity:0.5' : ''}">${task.name}</div>
          <div class="task-meta">
            <span>📁 ${task.category}</span>
            <span>🕐 ${formatDeadline(task.deadline)}</span>
          </div>
        </div>
        <span class="urgency-badge ${urgency.cls}">${urgency.label}</span>
        <button class="delete-btn" onclick="deleteTask(${task.id})"><i class="fa fa-trash"></i></button>
      </div>`;
  }).join('');
}

// =====================
// HABIT TRACKER
// =====================
function loadHabits() {
  return JSON.parse(localStorage.getItem('zerohour_habits') || '[]');
}

function saveHabits(habits) {
  localStorage.setItem('zerohour_habits', JSON.stringify(habits));
}

function addHabit() {
  const name = document.getElementById('habitName').value.trim();
  const frequency = document.getElementById('habitFrequency').value;
  if (!name) { alert('Please enter a habit name!'); return; }
  const habits = loadHabits();
  habits.push({ id: Date.now(), name, frequency, streak: 0, lastDone: null, completedToday: false });
  saveHabits(habits);
  document.getElementById('habitName').value = '';
  renderHabits();
}

function markHabitDone(id) {
  const habits = loadHabits();
  const today = new Date().toDateString();
  const habit = habits.find(h => h.id === id);
  if (!habit || habit.completedToday) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (habit.lastDone === yesterday.toDateString()) { habit.streak += 1; }
  else if (habit.lastDone !== today) { habit.streak = 1; }
  habit.lastDone = today;
  habit.completedToday = true;
  saveHabits(habits);
  renderHabits();
}

function deleteHabit(id) {
  saveHabits(loadHabits().filter(h => h.id !== id));
  renderHabits();
}

function renderHabits() {
  const habits = loadHabits();
  const container = document.getElementById('habitList');
  if (habits.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fa fa-fire"></i><br>No habits yet. Add one above!</div>`;
    return;
  }
  const today = new Date().toDateString();
  let changed = false;
  habits.forEach(h => {
    if (h.lastDone !== today && h.completedToday) { h.completedToday = false; changed = true; }
  });
  if (changed) saveHabits(habits);

  container.innerHTML = habits.map(habit => `
    <div class="habit-card">
      <div class="habit-info">
        <div class="habit-name">${habit.name}</div>
        <div class="habit-meta">📅 ${habit.frequency} &nbsp;|&nbsp; ${habit.completedToday ? '✅ Done today!' : '⏳ Not done yet'}</div>
      </div>
      <div class="habit-actions">
        <span class="streak-badge">🔥 ${habit.streak} streak</span>
        <button class="done-btn ${habit.completedToday ? 'completed' : ''}" onclick="markHabitDone(${habit.id})" ${habit.completedToday ? 'disabled' : ''}>
          ${habit.completedToday ? '✓ Done' : 'Mark Done'}
        </button>
        <button class="delete-btn" onclick="deleteHabit(${habit.id})"><i class="fa fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function getHabitMotivation() {
  const habits = loadHabits();
  const box = document.getElementById('motivationBox');
  box.classList.remove('hidden');
  box.textContent = '⚡ Generating your motivation...';
  const habitSummary = habits.length === 0 ? "No habits yet." : habits.map(h => `- ${h.name} (streak: ${h.streak}, done today: ${h.completedToday})`).join('\n');
  const prompt = `You are ZeroHour AI, an energetic productivity coach. Give a short powerful motivational message (4-6 lines) based on these habits. Be personal and energizing. Use emojis.\n\nHabits:\n${habitSummary}`;
  try {
    const reply = await callGemini(prompt);
    box.innerHTML = reply.replace(/\n/g, '<br>');
  } catch {
    box.textContent = 'Could not fetch motivation. Please try again!';
  }
}

// =====================
// INIT
// =====================
renderTasks();
renderHabits();