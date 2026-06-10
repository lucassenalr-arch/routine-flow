/* ==========================================
   ROUTINEFLOW - LOGICA PRINCIPAL (VANILLA JS)
   ========================================== */

// Elementos do DOM
const pages = {
  dashboard: document.getElementById('page-dashboard'),
  newTask: document.getElementById('page-new-task'),
  assistant: document.getElementById('page-assistant'),
  widget: document.getElementById('page-widget')
};

const navItems = document.querySelectorAll('.nav-item');
const daysCarousel = document.getElementById('daysCarousel');
const fixedTasksList = document.getElementById('fixed-tasks-list');
const adhocTasksList = document.getElementById('adhoc-tasks-list');
const widgetTasksList = document.getElementById('widget-tasks-list');

// Contadores de Badges
const fixedCountBadge = document.getElementById('fixed-count');
const adhocCountBadge = document.getElementById('adhoc-count');
const analysisFixedCount = document.getElementById('analysis-fixed-count');
const analysisFixedHours = document.getElementById('analysis-fixed-hours');
const analysisRecommendedLimit = document.getElementById('analysis-recommended-limit');
const currentLimitVal = document.getElementById('current-limit-val');
const currentSleepVal = document.getElementById('current-sleep-val');

// Elementos da Distribuição 24h
const workloadStatusText = document.getElementById('workloadStatusText');
const workloadAdviceText = document.getElementById('workloadAdviceText');
const distTasksSegment = document.getElementById('dist-tasks-segment');
const distSleepSegment = document.getElementById('dist-sleep-segment');
const distRestSegment = document.getElementById('dist-rest-segment');
const lblTasksH = document.getElementById('lbl-tasks-h');
const lblSleepH = document.getElementById('lbl-sleep-h');
const lblRestH = document.getElementById('lbl-rest-h');
const freeTimeText = document.getElementById('free-time-text');

// Modais
const overloadModal = document.getElementById('overloadModal');
const overloadModalText = document.getElementById('overloadModalText');
const proposalModal = document.getElementById('proposalModal');
const proposalModalText = document.getElementById('proposalModalText');

// Notificações
const toast = document.getElementById('toastNotification');
const toastTitle = document.getElementById('toastTitle');
const toastDesc = document.getElementById('toastDesc');
const notificationBanner = document.getElementById('notificationBanner');
const btnEnableNotifications = document.getElementById('btnEnableNotifications');

// Formulário de tarefas
const taskForm = document.getElementById('task-form');
const taskTypeSelect = document.getElementById('task-type');
const fixedRecurrenceGroup = document.getElementById('fixed-recurrence-group');
const dayButtons = document.querySelectorAll('.day-btn');

// Widget
const widgetDateText = document.getElementById('widget-date');
const widgetProgressText = document.getElementById('widgetProgressText');
const widgetProgressCircle = document.getElementById('widgetProgressCircle');
const widgetQuickTitle = document.getElementById('widget-quick-title');
const btnWidgetQuickAdd = document.getElementById('btn-widget-quick-add');

// ==========================================
// ESTADO DO APLICATIVO
// ==========================================
let state = {
  tasks: [],
  manualLimit: 8,           // Limite diário em horas de tarefas
  sleepTarget: 8,           // Meta de sono diária
  sleepStart: '23:00',      // Horário de ir dormir
  editingTaskId: null,      // Armazena o ID da tarefa em edição
  selectedDate: '',        // Data selecionada no formato YYYY-MM-DD
  notifiedTasks: {},       // Guarda IDs de tarefas que já notificaram hoje
  notifiedUpdates: { morning: '', noon: '', night: '', sunday: '' }, // Controles de notificação de atualização
  recWeekdays: [],         // Dias selecionados para nova tarefa fixa
  currentProfile: 'lucas', // Perfil ativo no dispositivo: 'lucas', 'bia', 'casal', 'todos'
  profiles: {
    lucas: { sleepStart: '23:00', sleepTarget: 8 },
    bia: { sleepStart: '22:30', sleepTarget: 8 }
  },
  syncConfig: {
    provider: 'none', // 'none', 'gist', 'firebase'
    gistId: '',
    gistToken: '',
    firebaseUrl: ''
  }
};

// Carregar estado do localStorage
function loadState() {
  try {
    const savedState = localStorage.getItem('routineflow_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      state.tasks = parsed.tasks || [];
      state.manualLimit = parsed.manualLimit || 8;
      state.sleepTarget = parsed.sleepTarget || 8;
      state.sleepStart = parsed.sleepStart || '23:00';
      state.notifiedTasks = parsed.notifiedTasks || {};
      state.notifiedUpdates = parsed.notifiedUpdates || { morning: '', noon: '', night: '', sunday: '' };
      state.currentProfile = parsed.currentProfile || 'lucas';
      state.profiles = parsed.profiles || {
        lucas: { sleepStart: '23:00', sleepTarget: 8 },
        bia: { sleepStart: '22:30', sleepTarget: 8 }
      };
      state.syncConfig = parsed.syncConfig || {
        provider: 'none',
        gistId: '',
        gistToken: '',
        firebaseUrl: ''
      };
      state.configUpdatedAt = parsed.configUpdatedAt || Date.now();
      return;
    }
  } catch (e) {
    console.error('Erro ao ler estado do localStorage', e);
  }
  
  // Adicionar tarefas padrão de exemplo se falhar ou estiver vazio
  state.tasks = [
    {
      id: '1',
      title: 'Café da manhã e Leitura',
      type: 'fixed',
      duration: 1,
      category: 'lazer',
      weekdays: [0, 1, 2, 3, 4, 5, 6], // Todos os dias
      time: '08:00',
      reminder: true,
      completed: {}
    },
    {
      id: '2',
      title: 'Academia / Treino',
      type: 'fixed',
      duration: 1.5,
      category: 'saude',
      weekdays: [1, 3, 5], // Seg, Qua, Sex
      time: '09:00',
      reminder: true,
      completed: {}
    },
    {
      id: '3',
      title: 'Trabalho / Projetos',
      type: 'fixed',
      duration: 4,
      category: 'trabalho',
      weekdays: [1, 2, 3, 4, 5], // Dias úteis
      time: '14:00',
      reminder: false,
      completed: {}
    }
  ];
  state.sleepStart = '23:00';
  state.notifiedUpdates = { morning: '', noon: '', night: '', sunday: '' };
  state.configUpdatedAt = Date.now();
  saveStateLocally();
}

// Salvar estado localmente no localStorage (sem disparar sync recursivo)
function saveStateLocally() {
  try {
    localStorage.setItem('routineflow_state', JSON.stringify({
      tasks: state.tasks,
      manualLimit: state.manualLimit,
      sleepTarget: state.sleepTarget,
      sleepStart: state.sleepStart,
      notifiedTasks: state.notifiedTasks,
      notifiedUpdates: state.notifiedUpdates,
      currentProfile: state.currentProfile,
      profiles: state.profiles,
      syncConfig: state.syncConfig,
      configUpdatedAt: state.configUpdatedAt || Date.now()
    }));
    // Re-agendar todas as notificações de segundo plano (PWA Notification Triggers)
    rescheduleAllNotificationTriggers();
  } catch (e) {
    console.error('Erro ao salvar no localStorage', e);
  }
}

// Salvar estado e disparar sincronização com a nuvem
function saveState() {
  state.configUpdatedAt = Date.now();
  saveStateLocally();
  syncWithCloud();
}

// ==========================================
// CONFIGURAÇÃO DE DIAS E NAVEGAÇÃO
// ==========================================

// Inicializar data selecionada como hoje
function initDates() {
  const today = new Date();
  state.selectedDate = formatDateString(today);
  renderDaysCarousel();
  
  // Atualizar data no topo
  const options = { weekday: 'long', day: 'numeric', month: 'short' };
  document.getElementById('current-date').innerText = today.toLocaleDateString('pt-BR', options);
  
  // Atualizar data do Widget
  widgetDateText.innerText = today.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Formatar objeto Date para YYYY-MM-DD local
function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Renderizar carrossel de 7 dias a partir de hoje
function renderDaysCarousel() {
  daysCarousel.innerHTML = '';
  const today = new Date();
  const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  for (let i = 0; i < 7; i++) {
    const current = new Date();
    current.setDate(today.getDate() + i);
    const dateStr = formatDateString(current);
    
    const dayCard = document.createElement('div');
    dayCard.className = `day-card ${dateStr === state.selectedDate ? 'active' : ''}`;
    dayCard.dataset.date = dateStr;
    
    dayCard.innerHTML = `
      <span class="day-name">${dayNames[current.getDay()]}</span>
      <span class="day-num">${current.getDate()}</span>
    `;
    
    dayCard.addEventListener('click', () => {
      // Remover active dos outros
      document.querySelectorAll('.day-card').forEach(c => c.classList.remove('active'));
      dayCard.classList.add('active');
      state.selectedDate = dateStr;
      
      // Ao mudar de dia, verificar rotina fixa e sugerir limite dinamicamente
      checkAndSuggestLimitForSelectedDate();
      
      updateUI();
    });
    
    daysCarousel.appendChild(dayCard);
  }
}

// Lógica de navegação de páginas (Bottom Nav)
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetPageId = item.getAttribute('data-target');
    
    // Atualizar classe ativa na barra de nav
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    
    // Mostrar a página correta
    Object.keys(pages).forEach(key => {
      const page = pages[key];
      if (page.id === targetPageId) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    // Controlar visibilidade do FAB global
    const globalFabs = document.querySelectorAll('.global-fab');
    if (targetPageId === 'page-new-task') {
      globalFabs.forEach(fab => fab.style.display = 'none');
    } else {
      globalFabs.forEach(fab => fab.style.display = 'flex');
    }

    updateUI();
  });
});

// Ações rápidas extras no widget
document.getElementById('btn-return-app').addEventListener('click', () => {
  // Simular clique no dashboard
  document.querySelector('.nav-item[data-target="page-dashboard"]').click();
});

// ==========================================
// RENDERIZAÇÃO DA AGENDA E GESTÃO DE DADOS
// ==========================================

// Atualizar tudo na tela
function updateUI() {
  // Sincronizar visualmente o perfil selecionado
  const activeProfile = state.currentProfile || 'lucas';
  document.querySelectorAll('.profile-pills .profile-pill').forEach(pill => {
    if (pill.dataset.profile === activeProfile) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  renderTasks();
  renderWidget();
  calculateWorkload();
  updateAssistantPage();
  lucide.createIcons();
}

// Filtrar tarefas para o dia selecionado (respeitando perfil ativo e ocultando deletadas)
function getTasksForSelectedDate() {
  const selectedDayOfWeek = new Date(state.selectedDate + 'T00:00:00').getDay();
  const activeProfile = state.currentProfile || 'lucas';
  
  return state.tasks.filter(task => {
    if (task.deleted) return false;
    
    let isForDate = false;
    if (task.type === 'fixed') {
      isForDate = task.weekdays.includes(selectedDayOfWeek);
    } else {
      isForDate = task.date === state.selectedDate;
    }
    
    if (!isForDate) return false;
    
    // Filtrar por proprietário
    const taskOwner = task.assignedTo || 'lucas';
    if (activeProfile === 'lucas') {
      return taskOwner === 'lucas' || taskOwner === 'casal';
    } else if (activeProfile === 'bia') {
      return taskOwner === 'bia' || taskOwner === 'casal';
    } else if (activeProfile === 'casal') {
      return taskOwner === 'casal';
    } else {
      // 'todos'
      return true;
    }
  });
}

// Renderizar tarefas no Dashboard
function renderTasks() {
  const todaysTasks = getTasksForSelectedDate();
  
  const fixedTasks = todaysTasks.filter(t => t.type === 'fixed');
  const adhocTasks = todaysTasks.filter(t => t.type === 'adhoc');
  
  fixedCountBadge.innerText = fixedTasks.length;
  adhocCountBadge.innerText = adhocTasks.length;
  
  // Renderizar Fixas
  if (fixedTasks.length === 0) {
    fixedTasksList.innerHTML = '<div class="empty-state">Nenhuma tarefa fixa hoje</div>';
  } else {
    fixedTasksList.innerHTML = fixedTasks.map(task => createTaskHTML(task)).join('');
  }
  
  // Renderizar Adicionais
  if (adhocTasks.length === 0) {
    adhocTasksList.innerHTML = '<div class="empty-state">Nenhuma tarefa adicional hoje</div>';
  } else {
    adhocTasksList.innerHTML = adhocTasks.map(task => createTaskHTML(task)).join('');
  }

  // Adicionar ouvintes para concluir e excluir
  setupTaskEventListeners();
}

// Helper para gerar HTML do item de tarefa
function createTaskHTML(task) {
  const isCompleted = task.type === 'fixed' 
    ? !!task.completed[state.selectedDate] 
    : !!task.completedToday;
    
  const categoryLabels = {
    trabalho: '💼 Trabalho',
    saude: '💪 Saúde',
    estudo: '📚 Estudo',
    lazer: '☕ Lazer',
    domestico: '🏠 Doméstico',
    igreja: '⛪ Igreja'
  };
  const cat = task.category || 'trabalho';
  const catLabel = categoryLabels[cat] || '💼 Trabalho';
  
  // Tag de Proprietário
  const ownerNames = {
    lucas: 'Lucas',
    bia: 'Bia',
    casal: 'Casal'
  };
  const owner = task.assignedTo || 'lucas';
  const ownerName = ownerNames[owner] || 'Lucas';
  const ownerBadgeHtml = `<span class="task-owner-badge badge-owner-${owner}">${ownerName}</span>`;
    
  return `
    <div class="task-item ${task.type}-type ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-left">
        <button class="checkbox-btn" aria-label="Concluir tarefa">
          <i data-lucide="check"></i>
        </button>
        <div class="task-info">
          <span class="task-title">${task.title}</span>
          <div class="task-meta" style="flex-wrap: wrap; gap: 8px;">
            <span><i data-lucide="clock"></i> ${task.duration}h</span>
            ${task.time ? `<span><i data-lucide="bell"></i> ${task.time}</span>` : ''}
            <span class="category-badge cat-${cat}">${catLabel}</span>
            ${ownerBadgeHtml}
          </div>
        </div>
      </div>
      <div class="task-actions" style="display: flex; gap: 8px; align-items: center;">
        <button class="btn-edit-task" aria-label="Editar tarefa">
          <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
        </button>
        <button class="btn-delete-task" aria-label="Deletar tarefa">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `;
}

// Ouvintes nos botões de completar, editar e excluir
function setupTaskEventListeners() {
  // Completar tarefa
  document.querySelectorAll('.task-item .checkbox-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.task-item');
      const taskId = taskItem.dataset.id;
      toggleTaskCompletion(taskId);
    });
  });

  // Editar tarefa
  document.querySelectorAll('.task-item .btn-edit-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.task-item');
      const taskId = taskItem.dataset.id;
      startEditTask(taskId);
    });
  });

  // Deletar tarefa
  document.querySelectorAll('.task-item .btn-delete-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.task-item');
      const taskId = taskItem.dataset.id;
      deleteTask(taskId);
    });
  });
}

// Alternar conclusão
function toggleTaskCompletion(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    if (task.type === 'fixed') {
      task.completed[state.selectedDate] = !task.completed[state.selectedDate];
    } else {
      task.completedToday = !task.completedToday;
    }
    task.updatedAt = Date.now();
    saveState();
    updateUI();
    syncWithCloud(); // Enviar a conclusão para a nuvem
  }
}

// Deletar tarefa (Soft Delete para sincronização offline robusta)
function deleteTask(taskId) {
  state.tasks = state.tasks.map(t => {
    if (t.id === taskId) {
      return {
        ...t,
        deleted: true,
        updatedAt: Date.now()
      };
    }
    return t;
  });
  saveState();
  updateUI();
  showToastNotification('Tarefa excluída', 'A agenda foi atualizada.');
  syncWithCloud(); // Enviar a exclusão para a nuvem
}

// Iniciar a edição de uma tarefa
function startEditTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  state.editingTaskId = taskId;
  
  // Preencher os campos do formulário
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-category').value = task.category || 'trabalho';
  
  // Configurar proprietário (assignedTo)
  const owner = task.assignedTo || 'lucas';
  document.getElementById('task-owner').value = owner;
  document.querySelectorAll('.owner-selector-pills .owner-pill').forEach(pill => {
    if (pill.dataset.owner === owner) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
  
  const typeCardAdhoc = document.getElementById('type-card-adhoc');
  const typeCardFixed = document.getElementById('type-card-fixed');
  const fixedRecurrenceGroup = document.getElementById('fixed-recurrence-group');
  const taskDateGroup = document.getElementById('task-date-group');
  
  taskTypeSelect.value = task.type;
  
  if (task.type === 'fixed') {
    typeCardAdhoc.classList.remove('active');
    typeCardFixed.classList.add('active');
    fixedRecurrenceGroup.style.display = 'block';
    taskDateGroup.style.display = 'none';
    
    // Configurar dias recorrentes
    state.recWeekdays = [...task.weekdays];
    document.querySelectorAll('.weekday-selector .day-btn').forEach(btn => {
      const dayVal = parseInt(btn.dataset.day);
      if (task.weekdays.includes(dayVal)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  } else {
    typeCardAdhoc.classList.add('active');
    typeCardFixed.classList.remove('active');
    fixedRecurrenceGroup.style.display = 'none';
    taskDateGroup.style.display = 'block';
    
    document.getElementById('task-date').value = task.date || '';
  }
  
  // Configurar duração
  const totalHours = parseFloat(task.duration);
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  document.getElementById('task-duration-hours').value = hours;
  document.getElementById('task-duration-minutes').value = minutes;
  
  // Configurar horário e lembrete
  document.getElementById('task-time').value = task.time || '';
  document.getElementById('task-reminder').checked = !!task.reminder;
  
  // Alterar layout da tela para edição
  document.getElementById('task-form-title').innerText = 'Editar Afazer';
  document.getElementById('btn-save-task').innerHTML = '<i data-lucide="check"></i> Salvar Alterações';
  document.getElementById('btn-cancel-edit').style.display = 'block';
  
  // Navegar para a página do formulário
  document.querySelector('.nav-item[data-target="page-new-task"]').click();
  lucide.createIcons();
}

// Função auxiliar para resetar o formulário com dados padrões
function resetForm() {
  state.editingTaskId = null;
  taskForm.reset();
  document.querySelectorAll('.weekday-selector .day-btn').forEach(btn => btn.classList.remove('selected'));
  state.recWeekdays = [];
  
  document.getElementById('task-form-title').innerText = 'Novo Afazer';
  document.getElementById('btn-save-task').innerHTML = '<i data-lucide="plus"></i> Adicionar à Agenda';
  document.getElementById('btn-cancel-edit').style.display = 'none';
  
  document.getElementById('fixed-recurrence-group').style.display = 'none';
  document.getElementById('task-date-group').style.display = 'block';
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
  document.getElementById('type-card-adhoc').classList.add('active');
  taskTypeSelect.value = 'adhoc';

  // Configurar proprietário (assignedTo) padrão com base no perfil ativo
  const defaultOwner = (state.currentProfile === 'todos' || !state.currentProfile) ? 'lucas' : state.currentProfile;
  document.getElementById('task-owner').value = defaultOwner;
  document.querySelectorAll('.owner-selector-pills .owner-pill').forEach(pill => {
    if (pill.dataset.owner === defaultOwner) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

// Cancelar a edição e restaurar layout
function cancelEditTask() {
  resetForm();
  // Voltar para a Agenda
  document.querySelector('.nav-item[data-target="page-dashboard"]').click();
  lucide.createIcons();
}

// ==========================================
// ALGORITMO GESTÃO DE GARGALO E ASSISTENTE
// ==========================================

// Obter a string de data para amanhã (YYYY-MM-DD)
function getTomorrowDateStr(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  return formatDateString(d);
}

// Obter a string de data para ontem (YYYY-MM-DD)
function getYesterdayDateStr(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return formatDateString(d);
}

// Retorna as tarefas cadastradas para uma data específica (fixas ou adicionais)
function getTasksForDate(targetDateStr, tasksList = state.tasks, profile = state.currentProfile) {
  const targetDayOfWeek = new Date(targetDateStr + 'T12:00:00').getDay();
  const activeProfile = profile || 'lucas';
  
  return tasksList.filter(task => {
    // Filtrar fora tarefas soft-deletadas
    if (task.deleted) return false;

    let isForDate = false;
    if (task.type === 'fixed') {
      isForDate = task.weekdays.includes(targetDayOfWeek);
    } else {
      isForDate = task.date === targetDateStr;
    }
    if (!isForDate) return false;

    // Filtrar por proprietário
    const taskOwner = task.assignedTo || 'lucas';
    if (activeProfile === 'lucas') {
      return taskOwner === 'lucas' || taskOwner === 'casal';
    } else if (activeProfile === 'bia') {
      return taskOwner === 'bia' || taskOwner === 'casal';
    } else if (activeProfile === 'casal') {
      return taskOwner === 'casal';
    } else {
      // 'todos'
      return true;
    }
  });
}

// Retorna o minuto de início da primeira atividade agendada do dia (ou default 08:30)
function getDayFirstActivityMin(dateStr, tasksList = state.tasks, profile = state.currentProfile) {
  const dayTasks = getTasksForDate(dateStr, tasksList, profile);
  if (dayTasks.length === 0) {
    return 8.5 * 60; // 08:30 default
  }

  const scheduled = dayTasks.filter(t => t.time);
  if (scheduled.length === 0) {
    return 8.5 * 60; // 08:30 default se não houver tarefas com horário
  }

  let minScheduledStart = 24 * 60;
  scheduled.forEach(t => {
    const [h, m] = t.time.split(':').map(Number);
    const start = h * 60 + m;
    if (start < minScheduledStart) {
      minScheduledStart = start;
    }
  });

  return minScheduledStart;
}

// Retorna o minuto em que a última atividade do dia termina (considerando agendadas e não agendadas)
function getDayLastActivityMin(dateStr, tasksList = state.tasks, profile = state.currentProfile) {
  const dayTasks = getTasksForDate(dateStr, tasksList, profile);
  if (dayTasks.length === 0) {
    // Obter o sleepStart do perfil
    const calcProfile = (profile === 'todos' || profile === 'casal') ? 'lucas' : profile;
    const profileSettings = state.profiles[calcProfile] || { sleepStart: '23:00' };
    const defaultSleepStart = profileSettings.sleepStart || '23:00';
    const [h, m] = defaultSleepStart.split(':').map(Number);
    return h * 60 + m;
  }

  const scheduled = dayTasks.filter(t => t.time);
  const unscheduled = dayTasks.filter(t => !t.time);

  let maxScheduledEnd = 0;
  scheduled.forEach(t => {
    const [h, m] = t.time.split(':').map(Number);
    const start = h * 60 + m;
    const end = start + parseFloat(t.duration) * 60;
    if (end > maxScheduledEnd) {
      maxScheduledEnd = end;
    }
  });

  // Se não houver agendadas, as não agendadas iniciam às 08:00
  let currentEnd = maxScheduledEnd > 0 ? maxScheduledEnd : 8 * 60;
  const unscheduledDurSum = unscheduled.reduce((sum, t) => sum + parseFloat(t.duration), 0) * 60;
  
  return currentEnd + unscheduledDurSum;
}

// Helper para calcular quantos minutos livres restam dentro da janela acordado (vigília)
function calculateFreeMinutes(todaysTasks, sleepStartMin, sleepDurationMin, wakeUpTodayMin) {
  // Inicializa 1440 minutos do dia como disponíveis (true)
  const available = new Array(1440).fill(true);

  // Marcar sono de hoje como indisponível
  for (let i = 0; i < sleepDurationMin; i++) {
    const min = (sleepStartMin + i) % 1440;
    available[min] = false;
  }

  // Marcar tarefas agendadas como indisponíveis
  const scheduled = todaysTasks.filter(t => t.time);
  const unscheduled = todaysTasks.filter(t => !t.time);

  scheduled.forEach(t => {
    const [th, tm] = t.time.split(':').map(Number);
    const start = th * 60 + tm;
    const durMin = Math.round(parseFloat(t.duration) * 60);
    for (let i = 0; i < durMin; i++) {
      const min = (start + i) % 1440;
      available[min] = false;
    }
  });

  // Encaixar tarefas não agendadas
  let currentSearchMin = (sleepStartMin + sleepDurationMin) % 1440; // acordar
  unscheduled.forEach(t => {
    let neededMinutes = Math.round(parseFloat(t.duration) * 60);
    let placed = 0;
    for (let step = 0; step < 1440 && placed < neededMinutes; step++) {
      const checkMin = (currentSearchMin + step) % 1440;
      if (available[checkMin]) {
        available[checkMin] = false;
        placed++;
      }
    }
    currentSearchMin = (currentSearchMin + placed) % 1440;
  });

  // Contar quantos minutos livres restam na janela de vigília (de wakeUpTodayMin até sleepStartMin)
  let freeMinCount = 0;
  const awakeDuration = (1440 - sleepDurationMin + 1440) % 1440;
  for (let i = 0; i < awakeDuration; i++) {
    const min = (wakeUpTodayMin + i) % 1440;
    if (available[min]) {
      freeMinCount++;
    }
  }

  return freeMinCount;
}

// Calcular total de horas do dia e atualizar distribuição de 24h
// Calcular total de horas, sono e descanso para uma data (real ou simulada)
// Helper para filtrar tarefas por perfil
function filterTasksByProfile(tasksList, profile) {
  return tasksList.filter(task => {
    if (task.deleted) return false;
    const owner = task.assignedTo || 'lucas';
    if (profile === 'lucas') {
      return owner === 'lucas' || owner === 'casal';
    } else if (profile === 'bia') {
      return owner === 'bia' || owner === 'casal';
    } else if (profile === 'casal') {
      return owner === 'casal';
    } else {
      // 'todos'
      return true;
    }
  });
}

// Calcular total de horas, sono e descanso para uma data (real ou simulada) para um perfil específico
function calculateSleepAndRestForDate(dateStr, tasksList = state.tasks, profile = state.currentProfile) {
  const calcProfile = (profile === 'todos' || profile === 'casal') ? 'lucas' : profile;
  
  // Filtrar tarefas baseadas no perfil que está sendo calculado
  const profileTasks = filterTasksByProfile(tasksList, calcProfile);
  
  const targetDayOfWeek = new Date(dateStr + 'T12:00:00').getDay();
  const todaysTasks = profileTasks.filter(task => {
    if (task.type === 'fixed') {
      return task.weekdays.includes(targetDayOfWeek);
    } else {
      return task.date === dateStr;
    }
  });
  
  const totalHours = todaysTasks.reduce((sum, task) => sum + parseFloat(task.duration), 0);
  const tomorrowDateStr = getTomorrowDateStr(dateStr);
  
  // Obter as metas e limites de sono do perfil
  const profileSettings = state.profiles[calcProfile] || { sleepStart: '23:00', sleepTarget: 8 };
  const sleepTargetMin = profileSettings.sleepTarget * 60;
  
  // Wake up de hoje
  const todayFirstCommitmentMin = getDayFirstActivityMin(dateStr, profileTasks, calcProfile);
  const wakeUpTodayMin = (todayFirstCommitmentMin - 90 + 1440) % 1440;
  
  // Sleep start de hoje (fim de todas as atividades de hoje)
  const lastTaskEndMin = getDayLastActivityMin(dateStr, profileTasks, calcProfile);
  const sleepStartMin = lastTaskEndMin % 1440;
  
  // Wake up de amanhã
  const tomorrowFirstCommitmentMin = getDayFirstActivityMin(tomorrowDateStr, profileTasks, calcProfile);
  const wakeUpTomorrowMin = (tomorrowFirstCommitmentMin - 90 + 1440) % 1440;
  
  // Calcular tempo de sono
  let sleepDurationMin = (wakeUpTomorrowMin - sleepStartMin + 1440) % 1440;
  
  const tomorrowTasks = profileTasks.filter(task => {
    const tomorrowDayOfWeek = new Date(tomorrowDateStr + 'T12:00:00').getDay();
    if (task.type === 'fixed') {
      return task.weekdays.includes(tomorrowDayOfWeek);
    } else {
      return task.date === tomorrowDateStr;
    }
  });
  
  if (todaysTasks.length === 0 && tomorrowTasks.length === 0) {
    sleepDurationMin = sleepTargetMin;
  }
  const sleepHours = sleepDurationMin / 60;
  
  // Calcular tempo de descanso (minutos livres de hoje na janela acordado)
  const freeMinutes = calculateFreeMinutes(todaysTasks, sleepStartMin, sleepDurationMin, wakeUpTodayMin);
  const restHours = freeMinutes / 60;
  
  return {
    totalHours,
    sleepHours,
    restHours
  };
}

// Calcular total de horas do dia e atualizar distribuição de 24h
function calculateWorkload() {
  const todaysTasks = getTasksForSelectedDate();
  const todayDateStr = state.selectedDate;
  const activeProfile = state.currentProfile || 'lucas';
  
  let totalHours = 0;
  let sleepHours = 0;
  let restHours = 0;
  let isBottleneck = false;
  let statusText = 'Equilibrado';
  let adviceText = '';

  const dotRest = document.querySelector('.dot-rest');
  if (dotRest) dotRest.className = 'legend-dot dot-rest';

  if (activeProfile === 'todos') {
    const lucasStats = calculateSleepAndRestForDate(todayDateStr, state.tasks, 'lucas');
    const biaStats = calculateSleepAndRestForDate(todayDateStr, state.tasks, 'bia');
    
    // Para a barra de 24h, usamos a média de ambos
    totalHours = (lucasStats.totalHours + biaStats.totalHours) / 2;
    sleepHours = (lucasStats.sleepHours + biaStats.sleepHours) / 2;
    restHours = (lucasStats.restHours + biaStats.restHours) / 2;
    
    // Atualizar labels para mostrar ambos
    lblTasksH.innerHTML = `L: <strong>${lucasStats.totalHours.toFixed(1).replace('.0', '')}h</strong> | B: <strong>${biaStats.totalHours.toFixed(1).replace('.0', '')}h</strong>`;
    lblSleepH.innerHTML = `L: <strong>${lucasStats.sleepHours.toFixed(1).replace('.0', '')}h</strong> | B: <strong>${biaStats.sleepHours.toFixed(1).replace('.0', '')}h</strong>`;
    lblRestH.innerHTML = `L: <strong>${(lucasStats.restHours + lucasStats.sleepHours).toFixed(1).replace('.0', '')}h</strong> | B: <strong>${(biaStats.restHours + biaStats.sleepHours).toFixed(1).replace('.0', '')}h</strong>`;
    
    const lucasGargalo = (lucasStats.sleepHours < 6 && lucasStats.restHours < 2);
    const biaGargalo = (biaStats.sleepHours < 6 && biaStats.restHours < 2);
    isBottleneck = lucasGargalo || biaGargalo;
    
    statusText = isBottleneck ? 'Gargalo Ativo' : 'Equilibrado';
    
    let lucasAdvice = '';
    if (lucasGargalo) {
      lucasAdvice = `Lucas em Gargalo (${lucasStats.sleepHours.toFixed(1)}h sono, ${lucasStats.restHours.toFixed(1)}h descanso).`;
    } else {
      lucasAdvice = `Lucas Saudável (${lucasStats.sleepHours.toFixed(1)}h sono, ${(lucasStats.restHours + lucasStats.sleepHours).toFixed(1)}h descanso total).`;
    }
    
    let biaAdvice = '';
    if (biaGargalo) {
      biaAdvice = `Bia em Gargalo (${biaStats.sleepHours.toFixed(1)}h sono, ${biaStats.restHours.toFixed(1)}h descanso).`;
    } else {
      biaAdvice = `Bia Saudável (${biaStats.sleepHours.toFixed(1)}h sono, ${(biaStats.restHours + biaStats.sleepHours).toFixed(1)}h descanso total).`;
    }
    
    adviceText = `🙋‍♂️ ${lucasAdvice}<br>🙋‍♀️ ${biaAdvice}`;
    
  } else {
    // Perfil individual ou casal
    const stats = calculateSleepAndRestForDate(todayDateStr, state.tasks, activeProfile);
    totalHours = stats.totalHours;
    sleepHours = stats.sleepHours;
    restHours = stats.restHours;
    
    // Atualizar labels normais
    lblTasksH.innerText = `${totalHours.toFixed(1).replace('.0', '')}h`;
    lblSleepH.innerText = `${sleepHours.toFixed(1).replace('.0', '')}h`;
    lblRestH.innerText = `${(restHours + sleepHours).toFixed(1).replace('.0', '')}h`;
    
    isBottleneck = (sleepHours < 6 && restHours < 2);
    
    if (isBottleneck) {
      statusText = restHours <= 0 ? 'Gargalo Crítico' : 'Gargalo';
      adviceText = restHours <= 0 
        ? 'ALERTA: Sem tempo de descanso entre afazeres e sono < 6h! Reduza a carga horária para proteger sua saúde.'
        : 'Gargalo Crítico! Menos de 6h de sono e menos de 2h de descanso livre hoje. Sugerimos adiar tarefas adicionais.';
    } else {
      if (restHours >= 5) {
        statusText = 'Excelente';
        adviceText = 'Seu saldo de descanso é ótimo! Muito tempo livre para relaxar, curtir um hobby ou estar com seu parceiro.';
      } else if (restHours >= 3) {
        statusText = 'Equilibrado';
        adviceText = 'Rotina sob controle. Você tem um tempo saudável para desacelerar e relaxar entre as atividades.';
      } else if (restHours >= 2) {
        statusText = 'Apertado';
        adviceText = 'Atenção: Tempo de descanso curto (entre 2h e 3h). Evite telas antes de dormir e tente fazer pausas rápidas.';
      } else {
        statusText = 'Ajustado';
        adviceText = 'Tempo de descanso reduzido (menos de 2h), mas o seu sono está adequado (6h+). Tente não adicionar mais afazeres.';
      }
    }
  }

  // Atualizar a barra visual
  const sumHours = totalHours + sleepHours + restHours;
  let tasksPercent = 0, sleepPercent = 0, restPercent = 0;
  if (sumHours > 0) {
    tasksPercent = (totalHours / sumHours) * 100;
    sleepPercent = (sleepHours / sumHours) * 100;
    restPercent = (restHours / sumHours) * 100;
  }
  
  distTasksSegment.style.width = `${tasksPercent}%`;
  distSleepSegment.style.width = `${sleepPercent}%`;
  distRestSegment.style.width = `${restPercent}%`;
  
  // Limpar classes antigas
  distRestSegment.className = 'dist-segment dist-rest';
  workloadStatusText.className = 'workload-status';
  
  if (isBottleneck) {
    distRestSegment.classList.add(restHours <= 0 ? 'sobrecarga' : 'gargalo');
    workloadStatusText.classList.add('gargalo');
    if (dotRest) dotRest.classList.add('gargalo');
  } else {
    if (restHours >= 3) {
      distRestSegment.classList.add('tranquilo');
      workloadStatusText.classList.add('tranquilo');
      if (dotRest) dotRest.classList.add('tranquilo');
    } else {
      distRestSegment.classList.add('atencao');
      workloadStatusText.classList.add('atencao');
      if (dotRest) dotRest.classList.add('atencao');
    }
  }

  workloadStatusText.innerText = statusText;
  workloadAdviceText.innerHTML = adviceText;

  // Atualizar aviso de horário livre
  if (freeTimeText) {
    if (activeProfile === 'todos') {
      const lucasTasks = filterTasksByProfile(todaysTasks, 'lucas');
      const biaTasks = filterTasksByProfile(todaysTasks, 'bia');
      const lucasTimeline = calculateFreeTimeTimeline(lucasTasks, 'lucas');
      const biaTimeline = calculateFreeTimeTimeline(biaTasks, 'bia');
      freeTimeText.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 6px; padding: 4px 0;">
          <div style="font-size: 11px;">🙋‍♂️ <strong>Lucas</strong> &raquo; ${lucasTimeline}</div>
          <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; font-size: 11px;">🙋‍♀️ <strong>Bia</strong> &raquo; ${biaTimeline}</div>
        </div>
      `;
    } else {
      freeTimeText.innerHTML = calculateFreeTimeTimeline(todaysTasks, activeProfile);
    }
  }

  // Renderizar o equilíbrio de categorias diário
  updateCategoryBalance(todaysTasks);

  // Lógica de conselhos sobre equilíbrio de categorias (aplicado para o perfil ativo ou primeiro)
  let categoryAdvice = '';
  const profileForAdvice = activeProfile === 'todos' ? 'lucas' : activeProfile;
  const filteredForAdvice = filterTasksByProfile(todaysTasks, profileForAdvice);
  const workHours = filteredForAdvice.filter(t => (t.category || 'trabalho') === 'trabalho').reduce((sum, t) => sum + parseFloat(t.duration), 0);
  const healthHours = filteredForAdvice.filter(t => (t.category || 'trabalho') === 'saude').reduce((sum, t) => sum + parseFloat(t.duration), 0);
  const leisureHours = filteredForAdvice.filter(t => (t.category || 'trabalho') === 'lazer').reduce((sum, t) => sum + parseFloat(t.duration), 0);

  if (workHours > 8) {
    categoryAdvice = ' <br>💼 <strong>Equilíbrio:</strong> Mais de 8h de trabalho hoje. Tente reservar um tempo para saúde e lazer.';
  } else if (filteredForAdvice.length > 0 && healthHours === 0) {
    categoryAdvice = ' <br>💪 <strong>Saúde:</strong> Que tal dedicar um tempo hoje para alongamento ou caminhada?';
  } else if (filteredForAdvice.length > 0 && leisureHours < 1.5) {
    categoryAdvice = ' <br>☕ <strong>Lazer:</strong> Seu tempo de lazer está curto hoje. Faça pausas rápidas para desacelerar.';
  }

  if (categoryAdvice) {
    workloadAdviceText.innerHTML += categoryAdvice;
  }
}

// Helper para converter minutos em string formato HH:MM
function minutesToTimeStr(minutes) {
  const m = Math.round(minutes) % (24 * 60);
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Algoritmo de cálculo de linha do tempo e horários livres (considerando o horário de sono e tarefas)
function calculateFreeTimeTimeline(todaysTasks, profile = state.currentProfile) {
  const todayDateStr = state.selectedDate;
  const tomorrowDateStr = getTomorrowDateStr(todayDateStr);
  const calcProfile = (profile === 'todos' || profile === 'casal') ? 'lucas' : profile;

  const todayFirstCommitmentMin = getDayFirstActivityMin(todayDateStr, state.tasks, calcProfile);
  const wakeUpTodayMin = (todayFirstCommitmentMin - 90 + 1440) % 1440;

  const lastTaskEndMin = getDayLastActivityMin(todayDateStr, state.tasks, calcProfile);
  const sleepStartMin = lastTaskEndMin % 1440;

  const tomorrowFirstCommitmentMin = getDayFirstActivityMin(tomorrowDateStr, state.tasks, calcProfile);
  const wakeUpTomorrowMin = (tomorrowFirstCommitmentMin - 90 + 1440) % 1440;

  let sleepDurationMin = (wakeUpTomorrowMin - sleepStartMin + 1440) % 1440;
  if (todaysTasks.length === 0 && getTasksForDate(tomorrowDateStr, state.tasks, calcProfile).length === 0) {
    const profileSettings = state.profiles[calcProfile] || { sleepTarget: 8 };
    sleepDurationMin = profileSettings.sleepTarget * 60;
  }
  
  const sleepTarget = sleepDurationMin / 60;

  // Inicializa 1440 minutos do dia como disponíveis (true)
  const available = new Array(1440).fill(true);

  // Marcar sono como indisponível
  for (let i = 0; i < sleepDurationMin; i++) {
    const min = (sleepStartMin + i) % 1440;
    available[min] = false;
  }

  // Marcar tarefas agendadas como indisponíveis
  const scheduled = todaysTasks.filter(t => t.time);
  const unscheduled = todaysTasks.filter(t => !t.time);

  scheduled.forEach(t => {
    const [th, tm] = t.time.split(':').map(Number);
    const start = th * 60 + tm;
    const durMin = Math.round(parseFloat(t.duration) * 60);
    for (let i = 0; i < durMin; i++) {
      const min = (start + i) % 1440;
      available[min] = false;
    }
  });

  // Tenta encaixar as tarefas sem horário na janela de vigília (horas acordado).
  let currentSearchMin = wakeUpTodayMin;
  let overflowMinutes = 0;

  unscheduled.forEach(t => {
    let neededMinutes = Math.round(parseFloat(t.duration) * 60);
    let placed = 0;
    
    for (let step = 0; step < 1440 && placed < neededMinutes; step++) {
      const checkMin = (currentSearchMin + step) % 1440;
      
      if (available[checkMin]) {
        available[checkMin] = false;
        placed++;
      }
    }
    
    if (placed < neededMinutes) {
      overflowMinutes += (neededMinutes - placed);
    }
    
    currentSearchMin = (currentSearchMin + placed) % 1440;
  });

  // Encontra intervalos de tempo livre reais dentro da janela de vigília (de wakeUpTodayMin a sleepStartMin)
  const awakeDuration = 1440 - sleepDurationMin;
  const freeIntervals = [];
  let inInterval = false;
  let intervalStart = null;

  for (let i = 0; i < awakeDuration; i++) {
    const min = (wakeUpTodayMin + i) % 1440;
    if (available[min]) {
      if (!inInterval) {
        inInterval = true;
        intervalStart = min;
      }
    } else {
      if (inInterval) {
        inInterval = false;
        freeIntervals.push({ start: intervalStart, end: min });
      }
    }
  }
  
  if (inInterval) {
    freeIntervals.push({ start: intervalStart, end: sleepStartMin });
  }

  // Formatar a exibição dos intervalos de tempo livre
  let freeTimeTextHtml = '';
  if (freeIntervals.length === 0) {
    freeTimeTextHtml = "Agenda cheia! Sem tempo livre hoje. ⏳";
  } else {
    const formatted = freeIntervals.map(interval => {
      const startStr = minutesToTimeStr(interval.start);
      const endStr = minutesToTimeStr(interval.end);
      return `<strong>${startStr} às ${endStr}</strong>`;
    });
    
    if (formatted.length === 1) {
      freeTimeTextHtml = `Livre: ${formatted[0]}`;
    } else {
      const last = formatted.pop();
      freeTimeTextHtml = `Livre: ${formatted.join(', ')} e ${last}`;
    }
  }

  // Mensagem adicional sobre sobrecarga (Overflow) ou período de sono
  if (overflowMinutes > 0) {
    const overflowHours = (overflowMinutes / 60).toFixed(1).replace('.0', '');
    freeTimeTextHtml += `<div class="timeline-warning" style="margin-top: 6px; font-size: 0.72rem; display: flex; align-items: center; gap: 6px; color: var(--color-danger); font-weight: 600;">
      <i data-lucide="alert-circle" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
      <span>Aviso: Tarefas excedem o dia em ${overflowHours}h! Seu sono ou descanso será afetado.</span>
    </div>`;
  } else {
    const sleepStartStr = minutesToTimeStr(sleepStartMin);
    const sleepEndStr = minutesToTimeStr(wakeUpTomorrowMin);
    freeTimeTextHtml += `<div class="timeline-info" style="margin-top: 6px; font-size: 0.7rem; display: flex; align-items: center; gap: 6px; opacity: 0.8; color: var(--color-text-muted);">
      <i data-lucide="moon" style="width: 14px; height: 14px; flex-shrink: 0; color: #3b82f6;"></i>
      <span>Período de Sono: ${sleepStartStr} às ${sleepEndStr} (${sleepTarget.toFixed(1).replace('.0', '')}h)</span>
    </div>`;
  }

  return freeTimeTextHtml;
}

// Lógica para verificar e sugerir limites baseada na rotina fixa
let lastProposedDate = '';
function checkAndSuggestLimitForSelectedDate() {
  // Evitar propor múltiplas vezes para o mesmo dia na mesma sessão de clique
  if (lastProposedDate === state.selectedDate) return;
  
  const todaysTasks = getTasksForSelectedDate();
  const fixedTasks = todaysTasks.filter(t => t.type === 'fixed');
  const fixedHours = fixedTasks.reduce((sum, t) => sum + parseFloat(t.duration), 0);
  
  // Se houver tarefas fixas significativas cadastradas (ex: trabalho de 4h ou academia 1.5h)
  // Calculamos um limite sugerido dinâmico para aquele dia específico
  // Tempo total disponível no dia = 24h. 8h sono, 7h (lazer, refeições, deslocamento). Sobram 9h úteis
  const baseProductiveHours = 8;
  const recommendedLimit = Math.max(4, Math.round(baseProductiveHours + (fixedHours * 0.4))); // Dá uma folga proporcional
  
  // Se o limite proposto for diferente do limite manual atual por mais de 1 hora, sugerimos a alteração
  if (fixedHours > 0 && Math.abs(state.manualLimit - recommendedLimit) >= 1) {
    lastProposedDate = state.selectedDate;
    
    proposalModalText.innerHTML = `
      Com base na sua rotina fixa de hoje (<strong>${fixedHours} horas</strong> de afazeres fixos), 
      o Assistente Flow calculou um limite ideal diário saudável de <strong>${recommendedLimit} horas</strong> totais para evitar gargalos e estresse.
    `;
    
    // Guardamos o limite sugerido temporariamente
    proposalModal.dataset.suggestedLimit = recommendedLimit;
    
    // Mostrar Modal
    setTimeout(() => {
      proposalModal.classList.add('active');
    }, 400);
  }
}

// Atualizar informações da tela do Assistente
function updateAssistantPage() {
  const fixedTasks = state.tasks.filter(t => t.type === 'fixed');
  
  // Calcular média semanal de horas fixas
  let totalFixedHours = 0;
  fixedTasks.forEach(task => {
    // Multiplica a duração pelo número de dias ativos na semana
    totalFixedHours += task.duration * task.weekdays.length;
  });
  
  const avgHoursPerDay = (totalFixedHours / 7).toFixed(1);
  
  analysisFixedCount.innerText = fixedTasks.length;
  analysisFixedHours.innerText = `${avgHoursPerDay}h em média/dia`;
  
  // Obter o perfil ativo para as configurações de sono/descanso no Assistente
  const settingsProfile = (state.currentProfile === 'todos' || state.currentProfile === 'casal') ? 'lucas' : state.currentProfile;
  if (!state.profiles[settingsProfile]) {
    state.profiles[settingsProfile] = { sleepStart: '23:00', sleepTarget: 8 };
  }
  const profileSettings = state.profiles[settingsProfile];
  state.sleepTarget = profileSettings.sleepTarget || 8;
  state.sleepStart = profileSettings.sleepStart || '23:00';
  
  // Sugestão geral baseada em 16h acordado
  const overallRec = Math.max(5, Math.round(16 - state.sleepTarget - parseFloat(avgHoursPerDay)));
  analysisRecommendedLimit.innerText = `${overallRec} horas/dia`;
  currentLimitVal.innerText = state.manualLimit;
  currentSleepVal.innerText = state.sleepTarget;

  // Atualizar inputs de horário de sono
  const sleepStartVal = state.sleepStart || '23:00';
  const [sleepStartH, sleepStartM] = sleepStartVal.split(':');
  const sleepHInput = document.getElementById('sleep-start-hours');
  const sleepMInput = document.getElementById('sleep-start-minutes');
  if (sleepHInput) sleepHInput.value = parseInt(sleepStartH) || 0;
  if (sleepMInput) sleepMInput.value = parseInt(sleepStartM) || 0;

  // Preencher campos de sincronização
  const syncProviderSelect = document.getElementById('sync-provider');
  const gistIdInput = document.getElementById('sync-gist-id');
  const gistTokenInput = document.getElementById('sync-gist-token');
  const firebaseUrlInput = document.getElementById('sync-firebase-url');
  
  if (syncProviderSelect && state.syncConfig) {
    syncProviderSelect.value = state.syncConfig.provider || 'none';
    if (gistIdInput) gistIdInput.value = state.syncConfig.gistId || '';
    if (gistTokenInput) gistTokenInput.value = state.syncConfig.gistToken || '';
    if (firebaseUrlInput) firebaseUrlInput.value = state.syncConfig.firebaseUrl || '';
    
    toggleSyncFields(state.syncConfig.provider);
  }

  // Atualizar o gráfico de consistência semanal e débito de sono (Sugestão 2 e 5)
  renderHabitTracker();
  renderSleepDebt();
}

// Ouvintes da tela do Assistente (Horas de Afazeres)
document.getElementById('btn-limit-minus').addEventListener('click', () => {
  if (state.manualLimit > 2) {
    state.manualLimit--;
    saveState();
    updateUI();
  }
});

document.getElementById('btn-limit-plus').addEventListener('click', () => {
  if (state.manualLimit < 18) {
    state.manualLimit++;
    saveState();
    updateUI();
  }
});

// Ouvintes da Meta de Sono no Assistente (salva no perfil ativo)
document.getElementById('btn-sleep-minus').addEventListener('click', () => {
  if (state.sleepTarget > 4) {
    state.sleepTarget--;
    const settingsProfile = (state.currentProfile === 'todos' || state.currentProfile === 'casal') ? 'lucas' : state.currentProfile;
    if (!state.profiles[settingsProfile]) {
      state.profiles[settingsProfile] = { sleepStart: '23:00', sleepTarget: 8 };
    }
    state.profiles[settingsProfile].sleepTarget = state.sleepTarget;
    saveState();
    updateUI();
  }
});

document.getElementById('btn-sleep-plus').addEventListener('click', () => {
  if (state.sleepTarget < 12) {
    state.sleepTarget++;
    const settingsProfile = (state.currentProfile === 'todos' || state.currentProfile === 'casal') ? 'lucas' : state.currentProfile;
    if (!state.profiles[settingsProfile]) {
      state.profiles[settingsProfile] = { sleepStart: '23:00', sleepTarget: 8 };
    }
    state.profiles[settingsProfile].sleepTarget = state.sleepTarget;
    saveState();
    updateUI();
  }
});

function handleSleepStartChange() {
  const hInput = document.getElementById('sleep-start-hours');
  const mInput = document.getElementById('sleep-start-minutes');
  if (hInput && mInput) {
    let h = parseInt(hInput.value);
    let m = parseInt(mInput.value);
    
    if (isNaN(h) || h < 0) h = 0;
    if (h > 23) h = 23;
    if (isNaN(m) || m < 0) m = 0;
    if (m > 59) m = 59;
    
    state.sleepStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const settingsProfile = (state.currentProfile === 'todos' || state.currentProfile === 'casal') ? 'lucas' : state.currentProfile;
    if (!state.profiles[settingsProfile]) {
      state.profiles[settingsProfile] = { sleepStart: '23:00', sleepTarget: 8 };
    }
    state.profiles[settingsProfile].sleepStart = state.sleepStart;
    saveState();
    calculateWorkload();
  }
}

function cleanSleepStartInputs() {
  const hInput = document.getElementById('sleep-start-hours');
  const mInput = document.getElementById('sleep-start-minutes');
  if (hInput && mInput) {
    let h = parseInt(hInput.value);
    let m = parseInt(mInput.value);
    if (isNaN(h) || h < 0) h = 23;
    if (h > 23) h = 23;
    if (isNaN(m) || m < 0) m = 0;
    if (m > 59) m = 59;
    hInput.value = h;
    mInput.value = m;
    state.sleepStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const settingsProfile = (state.currentProfile === 'todos' || state.currentProfile === 'casal') ? 'lucas' : state.currentProfile;
    if (!state.profiles[settingsProfile]) {
      state.profiles[settingsProfile] = { sleepStart: '23:00', sleepTarget: 8 };
    }
    state.profiles[settingsProfile].sleepStart = state.sleepStart;
    saveState();
    updateUI();
  }
}

const sleepHoursEl = document.getElementById('sleep-start-hours');
const sleepMinsEl = document.getElementById('sleep-start-minutes');
if (sleepHoursEl && sleepMinsEl) {
  sleepHoursEl.addEventListener('input', handleSleepStartChange);
  sleepMinsEl.addEventListener('input', handleSleepStartChange);
  sleepHoursEl.addEventListener('blur', cleanSleepStartInputs);
  sleepMinsEl.addEventListener('blur', cleanSleepStartInputs);
}

document.getElementById('btn-recalculate').addEventListener('click', () => {
  const avg = parseFloat(analysisFixedHours.innerText);
  const overallRec = Math.max(5, Math.round(16 - state.sleepTarget - avg));
  state.manualLimit = overallRec;
  saveState();
  updateUI();
  showToastNotification('Recalculado', `Seu limite de tarefas foi ajustado para ${overallRec}h com base na média.`);
});

// Ações do Modal de Proposta de Limite
document.getElementById('btn-proposal-accept').addEventListener('click', () => {
  const suggested = parseInt(proposalModal.dataset.suggestedLimit);
  if (suggested) {
    state.manualLimit = suggested;
    saveState();
    updateUI();
    showToastNotification('Limite atualizado', `Seu limite de hoje foi definido para ${suggested}h.`);
  }
  proposalModal.classList.remove('active');
});

document.getElementById('btn-proposal-custom').addEventListener('click', () => {
  proposalModal.classList.remove('active');
  // Redireciona para o Assistente para ajustar
  document.querySelector('[data-target="page-assistant"]').click();
});

// ==========================================
// CRIAÇÃO DE NOVAS TAREFAS E CONTROLE DE EXCESSO
// ==========================================

// Mostrar/Esconder seletor de dias dependendo do tipo de tarefa (usando cards agora)
const typeCards = document.querySelectorAll('.type-card');
typeCards.forEach(card => {
  card.addEventListener('click', () => {
    // Remover classe active de todos os cards
    typeCards.forEach(c => c.classList.remove('active'));
    // Adicionar active ao selecionado
    card.classList.add('active');
    
    const typeValue = card.dataset.type;
    taskTypeSelect.value = typeValue; // Atualiza o input oculto
    
    const fixedRecurrenceGroup = document.getElementById('fixed-recurrence-group');
    const taskDateGroup = document.getElementById('task-date-group');
    
    if (typeValue === 'fixed') {
      fixedRecurrenceGroup.style.display = 'block';
      taskDateGroup.style.display = 'none';
    } else {
      fixedRecurrenceGroup.style.display = 'none';
      taskDateGroup.style.display = 'block';
    }
  });
});

// Seletor de botões de dia de recorrência (Nova Tarefa Fixa)
dayButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('selected');
    const dayValue = parseInt(btn.dataset.day);
    
    if (state.recWeekdays.includes(dayValue)) {
      state.recWeekdays = state.recWeekdays.filter(d => d !== dayValue);
    } else {
      state.recWeekdays.push(dayValue);
    }
  });
});

// Submit do formulário de nova tarefa
let pendingTask = null; // Guarda tarefa que aguarda aprovação de limite
let pendingConflictTask = null; // Guarda tarefa que aguarda aprovação de conflito de horário

// Função para buscar conflitos de horário com outras tarefas agendadas no mesmo dia/recorrência
// Função para buscar conflitos de horário com outras tarefas agendadas no mesmo dia/recorrência
function findTimeConflict(tempTask) {
  if (!tempTask.time) return null; // Sem horário, sem conflito de colisão direta
  
  const [th, tm] = tempTask.time.split(':').map(Number);
  const tempStart = th * 60 + tm;
  const tempEnd = tempStart + parseFloat(tempTask.duration) * 60;
  
  const collidingTasks = state.tasks.filter(task => {
    // Excluir a própria tarefa se estiver editando
    if (state.editingTaskId && task.id === state.editingTaskId) return false;
    
    // Ignorar tarefas sem horário ou deletadas
    if (!task.time || task.deleted) return false;
    
    // Verificar conflito de proprietário (assignedTo)
    const tempOwner = tempTask.assignedTo || 'lucas';
    const taskOwner = task.assignedTo || 'lucas';
    
    let ownerConflict = false;
    if (tempOwner === 'casal' || taskOwner === 'casal') {
      ownerConflict = true; // Casal conflita com qualquer um (Lucas, Bia ou Casal)
    } else if (tempOwner === taskOwner) {
      ownerConflict = true; // Conflitam se forem da mesma pessoa
    }
    
    if (!ownerConflict) return false;
    
    // Verificar se ocorre no mesmo dia da semana ou data
    let dayOverlap = false;
    if (tempTask.type === 'fixed') {
      if (task.type === 'fixed') {
        // Ambas fixas: verifica se compartilham algum dia da semana
        dayOverlap = task.weekdays.some(d => tempTask.weekdays.includes(d));
      } else {
        // Proposta é fixa, existente é avulsa: verifica se o dia da semana da avulsa coincide com os da fixa
        const adhocDay = new Date(task.date + 'T00:00:00').getDay();
        dayOverlap = tempTask.weekdays.includes(adhocDay);
      }
    } else {
      // Proposta é avulsa (adhoc)
      if (task.type === 'fixed') {
        // Proposta é avulsa, existente é fixa: verifica se o dia da semana da avulsa coincide com os da fixa
        const adhocDay = new Date(tempTask.date + 'T00:00:00').getDay();
        dayOverlap = task.weekdays.includes(adhocDay);
      } else {
        // Ambas avulsas: verifica se a data é igual
        dayOverlap = (task.date === tempTask.date);
      }
    }
    
    if (!dayOverlap) return false;
    
    // Verificar sobreposição de intervalo de horas
    const [h, m] = task.time.split(':').map(Number);
    const start = h * 60 + m;
    const end = start + parseFloat(task.duration) * 60;
    
    return Math.max(tempStart, start) < Math.min(tempEnd, end);
  });
  
  return collidingTasks.length > 0 ? collidingTasks[0] : null;
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const title = document.getElementById('task-title').value.trim();
  const type = taskTypeSelect.value;
  
  // Calcular duração combinando Horas e Minutos
  const durationHours = parseInt(document.getElementById('task-duration-hours').value) || 0;
  const durationMinutes = parseInt(document.getElementById('task-duration-minutes').value) || 0;
  const duration = durationHours + (durationMinutes / 60);
  
  if (duration <= 0) {
    alert('Por favor, configure uma duração maior que 0 minutos.');
    return;
  }
  
  const time = document.getElementById('task-time').value;
  const dateInput = document.getElementById('task-date').value;
  const reminder = document.getElementById('task-reminder').checked;
  const owner = document.getElementById('task-owner').value || 'lucas';
  
  // Data alvo da tarefa
  let targetDate = state.selectedDate;
  if (type === 'adhoc' && dateInput) {
    targetDate = dateInput;
  }

  // Se estiver editando, busca tarefa existente para manter ID e estado de conclusão
  let existingTask = null;
  if (state.editingTaskId) {
    existingTask = state.tasks.find(t => t.id === state.editingTaskId);
  }

  // Criar objeto da tarefa temporário
  const tempTask = {
    id: state.editingTaskId || Date.now().toString(),
    title,
    type,
    duration,
    category: document.getElementById('task-category').value,
    assignedTo: owner,
    updatedAt: Date.now(),
    time: time || null,
    reminder,
    completed: existingTask ? existingTask.completed : {},
    completedToday: existingTask ? existingTask.completedToday : false
  };

  if (type === 'fixed') {
    if (state.recWeekdays.length === 0) {
      alert('Por favor, selecione ao menos um dia da semana para a tarefa fixa.');
      return;
    }
    tempTask.weekdays = [...state.recWeekdays];
  } else {
    tempTask.date = targetDate;
  }

  // 1. Verificar Conflito de Horário (Colisão de Horários agendados)
  const conflict = findTimeConflict(tempTask);
  if (conflict) {
    pendingConflictTask = tempTask;
    
    // Calcular intervalo do conflito
    const [ch, cm] = conflict.time.split(':').map(Number);
    const cStart = ch * 60 + cm;
    const cEnd = cStart + parseFloat(conflict.duration) * 60;
    const conflictStartStr = conflict.time;
    const conflictEndStr = minutesToTimeStr(cEnd);
    
    // Calcular intervalo da tarefa proposta
    const [ph, pm] = tempTask.time.split(':').map(Number);
    const pStart = ph * 60 + pm;
    const pEnd = pStart + parseFloat(tempTask.duration) * 60;
    const proposedStartStr = tempTask.time;
    const proposedEndStr = minutesToTimeStr(pEnd);
    
    const conflictModalText = document.getElementById('conflictModalText');
    const ownerNames = {
      lucas: 'Lucas',
      bia: 'Bia',
      casal: 'Casal'
    };
    const conflictOwner = ownerNames[conflict.assignedTo || 'lucas'];
    const tempOwner = ownerNames[tempTask.assignedTo || 'lucas'];
    
    conflictModalText.innerHTML = `
      Já existe o afazer <strong>"${conflict.title}"</strong> (${conflictOwner}) marcado das <strong>${conflictStartStr} às ${conflictEndStr}</strong> nesse dia.<br><br>
      Deseja agendar <strong>"${tempTask.title}"</strong> (${tempOwner}) (<strong>${proposedStartStr} às ${proposedEndStr}</strong>) no mesmo período?
    `;
    
    document.getElementById('conflictModal').classList.add('active');
  } else {
    // Se não houver conflito de horário, prossegue para o limite saudável
    checkOverloadAndSave(tempTask);
  }
});

// Função auxiliar para verificar sobrecarga diária e salvar a tarefa
function checkOverloadAndSave(tempTask) {
  const targetDate = tempTask.date || state.selectedDate;

  // Criar uma cópia da lista de tarefas para a simulação de sobrecarga
  let simulatedTasks = [...state.tasks];
  if (state.editingTaskId) {
    simulatedTasks = simulatedTasks.filter(t => t.id !== state.editingTaskId);
  }
  simulatedTasks.push(tempTask);

  // Calcular sono e descanso projetados com a nova tarefa
  const { sleepHours: projectedSleep, restHours: projectedRest } = 
    calculateSleepAndRestForDate(targetDate, simulatedTasks);

  // Regra do usuário: Considerar gargalo/sobrecarga SOMENTE SE sono < 6h E descanso < 2h
  const isProjectedBottleneck = (projectedSleep < 6 && projectedRest < 2);

  if (isProjectedBottleneck) {
    pendingTask = tempTask;
    overloadModalText.innerHTML = `
      Salvar a tarefa <strong>"${tempTask.title}"</strong> deixará você com 
      <strong>${projectedSleep.toFixed(1).replace('.0', '')}h</strong> de sono e apenas 
      <strong>${Math.max(0, projectedRest).toFixed(1).replace('.0', '')}h</strong> de descanso livre hoje.<br><br>
      Isso configura um <strong>gargalo na rotina</strong> (menos de 6h de sono e menos de 2h de descanso).<br><br>
      Deseja salvar mesmo assim?
    `;
    overloadModal.classList.add('active');
  } else {
    // Sem gargalo pelas novas regras, salva diretamente!
    saveNewTask(tempTask);
  }
}

// Salvar a nova tarefa e limpar formulário
function saveNewTask(taskObj) {
  const isEdit = !!state.editingTaskId;
  if (isEdit) {
    const idx = state.tasks.findIndex(t => t.id === state.editingTaskId);
    if (idx !== -1) {
      state.tasks[idx] = taskObj;
    }
    state.editingTaskId = null;
  } else {
    state.tasks.push(taskObj);
  }
  saveState();
  
  // Se for uma tarefa avulsa/adicional e tiver uma data específica, mudar o dashboard para essa data
  if (taskObj.type === 'adhoc' && taskObj.date) {
    state.selectedDate = taskObj.date;
    renderDaysCarousel();
  }
  
  // Limpar form
  taskForm.reset();
  dayButtons.forEach(btn => btn.classList.remove('selected'));
  state.recWeekdays = [];
  
  // Restaurar layout do form
  document.getElementById('task-form-title').innerText = 'Novo Afazer';
  document.getElementById('btn-save-task').innerHTML = '<i data-lucide="plus"></i> Adicionar à Agenda';
  document.getElementById('btn-cancel-edit').style.display = 'none';
  
  document.getElementById('fixed-recurrence-group').style.display = 'none';
  document.getElementById('task-date-group').style.display = 'block';
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
  document.getElementById('type-card-adhoc').classList.add('active');
  taskTypeSelect.value = 'adhoc';
  
  // Ir para tela de Dashboard
  document.querySelector('.nav-item[data-target="page-dashboard"]').click();
  
  if (isEdit) {
    showToastNotification('Tarefa atualizada!', `"${taskObj.title}" foi alterada.`);
  } else {
    showToastNotification('Tarefa adicionada!', `"${taskObj.title}" foi agendada.`);
  }
  updateUI();
}

// ==========================================
// SINCRONIZAÇÃO EM NUVEM E MESCLAGEM
// ==========================================
function toggleSyncFields(provider) {
  const gistFields = document.getElementById('sync-gist-fields');
  const firebaseFields = document.getElementById('sync-firebase-fields');
  if (gistFields) gistFields.style.display = provider === 'gist' ? 'flex' : 'none';
  if (firebaseFields) firebaseFields.style.display = provider === 'firebase' ? 'flex' : 'none';
}

function mergeStates(local, remote) {
  if (!remote) return;
  
  // 1. Mesclar Configuração geral (baseado em configUpdatedAt)
  const localConfigTime = local.configUpdatedAt || 0;
  const remoteConfigTime = remote.configUpdatedAt || 0;
  
  if (remoteConfigTime > localConfigTime) {
    state.manualLimit = remote.manualLimit ?? state.manualLimit;
    state.sleepTarget = remote.sleepTarget ?? state.sleepTarget;
    state.sleepStart = remote.sleepStart ?? state.sleepStart;
    state.profiles = remote.profiles ?? state.profiles;
    state.configUpdatedAt = remoteConfigTime;
  }
  
  // 2. Mesclar Lista de Tarefas (baseado em updatedAt individual por tarefa)
  const localTasks = local.tasks || [];
  const remoteTasks = remote.tasks || [];
  const taskMap = new Map();
  
  // Adiciona as tarefas locais no mapa
  localTasks.forEach(task => {
    taskMap.set(task.id, task);
  });
  
  // Compara com as tarefas remotas
  remoteTasks.forEach(remoteTask => {
    const localTask = taskMap.get(remoteTask.id);
    if (!localTask) {
      // Tarefa nova remota
      taskMap.set(remoteTask.id, remoteTask);
    } else {
      // Ambos possuem a tarefa, mantém a mais atualizada
      const localTime = localTask.updatedAt || 0;
      const remoteTime = remoteTask.updatedAt || 0;
      if (remoteTime > localTime) {
        taskMap.set(remoteTask.id, remoteTask);
      }
    }
  });
  
  state.tasks = Array.from(taskMap.values());
}

let isSyncing = false;
async function syncWithCloud(forceManual = false) {
  if (isSyncing) return;
  
  const config = state.syncConfig;
  const syncStatus = document.getElementById('sync-status');
  
  if (!config || config.provider === 'none') {
    if (syncStatus) {
      syncStatus.className = 'sync-indicator offline';
      syncStatus.title = 'Sincronização Desativada';
    }
    return;
  }
  
  isSyncing = true;
  if (syncStatus) {
    syncStatus.className = 'sync-indicator syncing';
    syncStatus.title = 'Sincronizando...';
  }
  
  try {
    let remoteState = null;
    
    if (config.provider === 'gist') {
      if (!config.gistId || !config.gistToken) {
        throw new Error('Gist ID e Token são obrigatórios.');
      }
      
      const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
        headers: {
          'Authorization': `token ${config.gistToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API retornou status ${response.status}`);
      }
      
      const gistData = await response.json();
      const file = gistData.files && gistData.files['routineflow_state.json'];
      if (file && file.content) {
        try {
          remoteState = JSON.parse(file.content);
        } catch (e) {
          console.warn('Conteúdo do Gist não é um JSON válido, iniciando...');
          remoteState = {};
        }
      } else {
        remoteState = {};
      }
      
    } else if (config.provider === 'firebase') {
      if (!config.firebaseUrl) {
        throw new Error('URL do Firebase é obrigatória.');
      }
      
      const response = await fetch(config.firebaseUrl);
      if (!response.ok) {
        throw new Error(`Firebase retornou status ${response.status}`);
      }
      
      const text = await response.text();
      if (text && text !== 'null') {
        remoteState = JSON.parse(text);
      } else {
        remoteState = {};
      }
    }
    
    // Mesclar local com remoto se obtido
    if (remoteState) {
      mergeStates(state, remoteState);
      saveStateLocally();
    }
    
    // Preparar dados mesclados para salvar de volta na nuvem
    const mergedContent = JSON.stringify({
      tasks: state.tasks,
      manualLimit: state.manualLimit,
      sleepTarget: state.sleepTarget,
      sleepStart: state.sleepStart,
      profiles: state.profiles,
      configUpdatedAt: state.configUpdatedAt || Date.now()
    });
    
    if (config.provider === 'gist') {
      const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${config.gistToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'routineflow_state.json': {
              'content': mergedContent
            }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao salvar no Gist (Status ${response.status})`);
      }
    } else if (config.provider === 'firebase') {
      const response = await fetch(config.firebaseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: mergedContent
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao salvar no Firebase (Status ${response.status})`);
      }
    }
    
    if (syncStatus) {
      syncStatus.className = 'sync-indicator online';
      syncStatus.title = `Sincronizado em ${new Date().toLocaleTimeString()}`;
    }
    
    if (forceManual) {
      showToastNotification('Sincronizado!', 'Os dados foram atualizados com a nuvem.');
    }
    
    // Atualizar UI com os dados possivelmente novos
    updateUI();
    
  } catch (error) {
    console.error('Erro de sincronização:', error);
    if (syncStatus) {
      syncStatus.className = 'sync-indicator offline';
      syncStatus.title = `Erro: ${error.message}`;
    }
    if (forceManual) {
      showToastNotification('Erro de Sincronização', error.message);
    }
  } finally {
    isSyncing = false;
  }
}

// Ações do Modal de Sobrecarga
document.getElementById('btn-modal-add-anyway').addEventListener('click', () => {
  if (pendingTask) {
    saveNewTask(pendingTask);
    pendingTask = null;
  }
  overloadModal.classList.remove('active');
});

document.getElementById('btn-modal-increase-limit').addEventListener('click', () => {
  if (pendingTask) {
    // Aumenta o limite para cobrir a diferença
    const todaysTasks = getTasksForSelectedDate();
    const currentDayHours = todaysTasks.reduce((sum, t) => sum + parseFloat(t.duration), 0);
    const neededLimit = Math.ceil(currentDayHours + pendingTask.duration);
    
    state.manualLimit = neededLimit;
    saveState();
    saveNewTask(pendingTask);
    pendingTask = null;
  }
  overloadModal.classList.remove('active');
});

document.getElementById('btn-modal-cancel').addEventListener('click', () => {
  pendingTask = null;
  overloadModal.classList.remove('active');
});

// ==========================================
// SIMULAÇÃO DO WIDGET DE TELA INICIAL
// ==========================================

function renderWidget() {
  const todaysTasks = getTasksForSelectedDate();
  
  // Calcular progresso
  const total = todaysTasks.length;
  const completed = todaysTasks.filter(task => {
    return task.type === 'fixed' 
      ? !!task.completed[state.selectedDate] 
      : !!task.completedToday;
  }).length;
  
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  // Atualizar texto e círculo de progresso
  widgetProgressText.innerText = `${percentage}%`;
  
  const strokeDashoffset = 88 - (88 * percentage) / 100;
  widgetProgressCircle.style.strokeDashoffset = strokeDashoffset;
  
  // Renderizar a lista do Widget
  if (todaysTasks.length === 0) {
    widgetTasksList.innerHTML = '<div class="empty-state" style="padding: 10px; font-size: 0.72rem;">Nenhum afazer hoje</div>';
  } else {
    widgetTasksList.innerHTML = todaysTasks.map(task => {
      const isCompleted = task.type === 'fixed' 
        ? !!task.completed[state.selectedDate] 
        : !!task.completedToday;
        
      return `
        <div class="widget-task-item ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
          <button class="widget-checkbox" aria-label="Marcar como concluída no widget">
            <i data-lucide="check"></i>
          </button>
          <span class="widget-task-title">${task.title}</span>
          <span class="widget-task-duration">${task.duration}h</span>
        </div>
      `;
    }).join('');
    
    // Registrar cliques nas checkboxes do Widget
    document.querySelectorAll('.widget-task-item .widget-checkbox').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.widget-task-item');
        const taskId = item.dataset.id;
        toggleTaskCompletion(taskId);
      });
    });
  }
}

// Adição rápida pelo Widget (Simulando ação de widget de tela inicial)
btnWidgetQuickAdd.addEventListener('click', () => {
  addQuickWidgetTask();
});

widgetQuickTitle.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addQuickWidgetTask();
  }
});

function addQuickWidgetTask() {
  const title = widgetQuickTitle.value.trim();
  if (!title) return;
  
  // Criar tarefa rápida adicional para hoje (duração padrão 1h)
  const owner = (state.currentProfile === 'todos' || !state.currentProfile) ? 'lucas' : state.currentProfile;
  const quickTask = {
    id: Date.now().toString(),
    title,
    type: 'adhoc',
    duration: 1,
    category: 'trabalho',
    assignedTo: owner,
    updatedAt: Date.now(),
    date: state.selectedDate,
    time: null,
    reminder: true,
    completed: {},
    completedToday: false
  };

  // Verificar gargalo de tempo simulando o sono e descanso com a nova tarefa rápida
  let simulatedTasks = [...state.tasks];
  simulatedTasks.push(quickTask);

  const { sleepHours: projectedSleep, restHours: projectedRest } = 
    calculateSleepAndRestForDate(state.selectedDate, simulatedTasks);

  // Regra do usuário: Considerar gargalo/sobrecarga SOMENTE SE sono < 6h E descanso < 2h
  const isProjectedBottleneck = (projectedSleep < 6 && projectedRest < 2);
  
  if (isProjectedBottleneck) {
    // Alerta de sobrecarga
    pendingTask = quickTask;
    overloadModalText.innerHTML = `
      Ao adicionar <strong>"${title}"</strong> via Widget, você ficaria com 
      <strong>${projectedSleep.toFixed(1).replace('.0', '')}h</strong> de sono e apenas 
      <strong>${Math.max(0, projectedRest).toFixed(1).replace('.0', '')}h</strong> de descanso livre.<br><br>
      Isso configura um <strong>gargalo na rotina</strong> (menos de 6h de sono e menos de 2h de descanso).<br><br>
      Deseja adicionar mesmo assim?
    `;
    overloadModal.classList.add('active');
  } else {
    state.tasks.push(quickTask);
    saveState();
    widgetQuickTitle.value = '';
    updateUI();
    showToastNotification('Widget: Adicionado!', `"${quickTask.title}" inserido na agenda.`);
  }
}

// ==========================================
// SISTEMA DE LEMBRETES E NOTIFICAÇÕES NATIVAS
// ==========================================

// Configurar Notificações nativas
function setupNotifications() {
  if (!('Notification' in window)) {
    // Navegador não suporta
    return;
  }
  
  if (Notification.permission === 'default') {
    // Mostrar banner interno pedindo permissão de notificações
    notificationBanner.style.display = 'flex';
  }
  
  btnEnableNotifications.addEventListener('click', () => {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        notificationBanner.style.display = 'none';
        showToastNotification('Lembretes Ativados!', 'Você receberá avisos do RoutineFlow no celular.');
        
        // Disparar uma notificação de teste nativa
        triggerNativeNotification('RoutineFlow', 'Notificações nativas ativadas com sucesso!');
      } else {
        notificationBanner.style.display = 'none';
      }
    });
  });
}

// Disparar notificação em duas camadas (Native + In-App Toast)
function triggerNotification(title, message) {
  // 1. Mostrar Toast in-app animado na tela do celular
  showToastNotification(title, message);
  
  // 2. Disparar notificação nativa do sistema Android (PWA)
  triggerNativeNotification(title, message);
}

// Mostrar Toast in-app
function showToastNotification(title, message) {
  toastTitle.innerText = title;
  toastDesc.innerText = message;
  
  toast.classList.add('active');
  
  // Vibrar dispositivo se suportado (padrão curto)
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, 4000);
}

// Disparar Notificação Nativa
function triggerNativeNotification(title, body) {
  if (Notification.permission === 'granted') {
    // Se o service worker estiver ativo, usa ele (melhor suporte offline e background no celular)
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body: body,
          icon: 'icon.png',
          vibrate: [200, 100, 200],
          badge: 'icon.png',
          tag: 'routineflow-reminder'
        });
      });
    } else {
      // Fallback padrão se não tiver SW pronto
      new Notification(title, {
        body: body,
        icon: 'icon.png',
        vibrate: [200, 100, 200]
      });
    }
  }
}

// Loop de verificação de horários para disparar os lembretes (roda a cada 30 segundos no primeiro plano/fallback)
function startNotificationScheduler() {
  setInterval(() => {
    const now = new Date();
    const currentDateStr = formatDateString(now);
    const todayDayOfWeek = now.getDay();
    
    // Obter tarefas específicas de HOJE
    const todaysTasks = state.tasks.filter(task => {
      if (task.type === 'fixed') {
        return task.weekdays.includes(todayDayOfWeek);
      } else {
        return task.date === currentDateStr;
      }
    });
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 1. Lembretes de tarefas agendadas para hoje: 1h30 (90 minutos) antes do compromisso
    todaysTasks.forEach(task => {
      if (!task.time || !task.reminder) return;
      
      const [taskHour, taskMinute] = task.time.split(':').map(Number);
      const nowInMinutes = currentHour * 60 + currentMinute;
      const taskInMinutes = taskHour * 60 + taskMinute;
      const diff = taskInMinutes - nowInMinutes;
      
      // Faltando entre 88 e 90 minutos
      const notificationKey = `task-${task.id}-90min`;
      if (diff >= 88 && diff <= 90 && state.notifiedTasks[notificationKey] !== currentDateStr) {
        triggerNotification('Compromisso em breve', `Seu afazer "${task.title}" começará em 1h30 (às ${task.time})!`);
        state.notifiedTasks[notificationKey] = currentDateStr;
        saveState();
      }
    });

    // 2. Lembrete diário às 06h da manhã (das 06h às 07:59 se não foi enviado hoje)
    if (currentHour >= 6 && currentHour < 8) {
      if (state.notifiedUpdates.morning !== currentDateStr) {
        let bodyText = 'Nenhum compromisso agendado para hoje. Aproveite o dia!';
        if (todaysTasks.length > 0) {
          const taskTitles = todaysTasks.map(t => t.time ? `[${t.time}] ${t.title}` : t.title).join(', ');
          bodyText = `Sua rotina hoje: ${taskTitles}`;
        }
        triggerNotification('RoutineFlow: Bom dia!', bodyText);
        state.notifiedUpdates.morning = currentDateStr;
        saveState();
      }
    }

    // 3. Lembrete de Domingo às 16h (das 16h às 16:59 no domingo)
    if (todayDayOfWeek === 0 && currentHour >= 16 && currentHour < 17) {
      if (state.notifiedUpdates.sunday !== currentDateStr) {
        triggerNotification('RoutineFlow', 'Confira sua rotina semanal e evite surpresas!');
        state.notifiedUpdates.sunday = currentDateStr;
        saveState();
      }
    }
  }, 30000); // Roda a cada 30s
}

// Agendar todas as notificações em segundo plano usando a API Fugu Notification Triggers (TimestampTrigger)
async function rescheduleAllNotificationTriggers() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  if (!reg || !('showNotification' in reg)) return;

  // Verificar se a permissão foi concedida
  if (Notification.permission !== 'granted') {
    console.log('Permissão de notificações não concedida. Ignorando agendamento de triggers.');
    return;
  }

  // Verificar suporte à API de Triggers
  if (!('showTrigger' in Notification.prototype) || !window.TimestampTrigger) {
    console.warn('Notification Triggers API (TimestampTrigger) não suportada neste dispositivo. Usando modo de primeiro plano.');
    return;
  }

  try {
    // 1. Limpar todos os triggers antigos agendados por nós
    const activeNotifications = await reg.getNotifications({ includeTriggered: true });
    activeNotifications.forEach(n => {
      if (n.tag && n.tag.startsWith('routineflow-')) {
        n.close();
      }
    });
  } catch (err) {
    console.error('Erro ao limpar triggers anteriores:', err);
  }

  // 2. Agendar Lembrete de Domingo às 16:00
  try {
    const nextSunday = new Date();
    const currentDay = nextSunday.getDay();
    const daysUntilSunday = (7 - currentDay) % 7;
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(16, 0, 0, 0);
    
    if (nextSunday.getTime() <= Date.now()) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }
    
    await reg.showNotification('RoutineFlow', {
      body: 'Confira sua rotina semanal e evite surpresas!',
      icon: 'icon.png',
      badge: 'icon.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'routineflow-sunday',
      requireInteraction: true,
      showTrigger: new TimestampTrigger(nextSunday.getTime())
    });
  } catch (err) {
    console.error('Erro ao agendar trigger de domingo:', err);
  }

  // 3. Agendar Notificações Diárias às 06:00 AM para os próximos 7 dias
  for (let i = 0; i < 7; i++) {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      targetDate.setHours(6, 0, 0, 0);

      if (targetDate.getTime() <= Date.now()) {
        continue;
      }

      const dateStr = formatDateString(targetDate);
      const dayTasks = getTasksForDate(dateStr);
      
      let bodyText = 'Nenhum compromisso agendado para hoje. Aproveite o dia!';
      if (dayTasks.length > 0) {
        const taskTitles = dayTasks.map(t => t.time ? `[${t.time}] ${t.title}` : t.title).join(', ');
        bodyText = `Sua rotina hoje: ${taskTitles}`;
      }

      await reg.showNotification('RoutineFlow: Bom dia!', {
        body: bodyText,
        icon: 'icon.png',
        badge: 'icon.png',
        vibrate: [200, 100, 200],
        tag: `routineflow-daily-${dateStr}`,
        requireInteraction: true,
        showTrigger: new TimestampTrigger(targetDate.getTime())
      });
    } catch (err) {
      console.error(`Erro ao agendar trigger diário ${i}:`, err);
    }
  }

  // 4. Agendar Avisos das Tarefas (1h30 antes) para os próximos 7 dias
  for (let i = 0; i < 7; i++) {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      const dateStr = formatDateString(targetDate);
      const dayTasks = getTasksForDate(dateStr);

      const scheduledTasks = dayTasks.filter(t => t.time);

      for (const task of scheduledTasks) {
        const [th, tm] = task.time.split(':').map(Number);
        const taskTime = new Date(targetDate.getTime());
        taskTime.setHours(th, tm, 0, 0);

        // Subtrair 1 hora e 30 minutos (90 minutos)
        const triggerTime = new Date(taskTime.getTime() - 90 * 60 * 1000);

        if (triggerTime.getTime() > Date.now()) {
          await reg.showNotification('Compromisso em breve', {
            body: `Seu afazer "${task.title}" começará em 1h30 (às ${task.time})!`,
            icon: 'icon.png',
            badge: 'icon.png',
            vibrate: [300, 100, 300, 100, 300],
            tag: `routineflow-task-${task.id}-${dateStr}`,
            requireInteraction: true,
            showTrigger: new TimestampTrigger(triggerTime.getTime())
          });
        }
      }
    } catch (err) {
      console.error(`Erro ao agendar trigger de compromisso ${i}:`, err);
    }
  }
}

// ==========================================
// REGISTRO DE SERVICE WORKER DO PWA
// ==========================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker registrado com sucesso:', reg.scope))
        .catch(err => console.error('Falha ao registrar Service Worker:', err));
    });
  }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initDates();
  updateUI();
  setupNotifications();
  startNotificationScheduler();
  registerServiceWorker();
  
  // Registrar cliques nos botões flutuantes globais (FAB)
  document.querySelectorAll('.global-fab').forEach(fab => {
    fab.addEventListener('click', () => {
      document.querySelector('.nav-item[data-target="page-new-task"]').click();
    });
  });

  // Botão de cancelar edição
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', cancelEditTask);
  }

  // Ações do Modal de Conflito de Horário
  const btnConflictAnyway = document.getElementById('btn-conflict-add-anyway');
  const btnConflictCancel = document.getElementById('btn-conflict-cancel');
  if (btnConflictAnyway) {
    btnConflictAnyway.addEventListener('click', () => {
      if (pendingConflictTask) {
        checkOverloadAndSave(pendingConflictTask);
        pendingConflictTask = null;
      }
      const conflictModal = document.getElementById('conflictModal');
      if (conflictModal) conflictModal.classList.remove('active');
    });
  }

  if (btnConflictCancel) {
    btnConflictCancel.addEventListener('click', () => {
      pendingConflictTask = null;
      const conflictModal = document.getElementById('conflictModal');
      if (conflictModal) conflictModal.classList.remove('active');
    });
  }
  
  // Atualizar hora simulada na barra de status a cada minuto
  function updateSimulatedTime() {
    const now = new Date();
    document.getElementById('statusTime').innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  updateSimulatedTime();
  setInterval(updateSimulatedTime, 60000);
  
  // Verificar atalhos do PWA/Shortcuts na URL ao iniciar
  const urlParams = new URLSearchParams(window.location.search);
  const shortcut = urlParams.get('shortcut');
  
  if (shortcut === 'add-task') {
    // Abre a aba "Novo"
    setTimeout(() => {
      document.querySelector('.nav-item[data-target="page-new-task"]').click();
    }, 500);
  } else if (shortcut === 'widget') {
    // Abre a aba "Widget"
    setTimeout(() => {
      document.querySelector('.nav-item[data-target="page-widget"]').click();
    }, 500);
  }

  // Botões de atraso rápido (Sugestão 4)
  const btnDelay15 = document.getElementById('btn-delay-15');
  const btnDelay30 = document.getElementById('btn-delay-30');
  if (btnDelay15) {
    btnDelay15.addEventListener('click', () => {
      delayUpcomingTasks(15);
    });
  }
  if (btnDelay30) {
    btnDelay30.addEventListener('click', () => {
      delayUpcomingTasks(30);
    });
  }

  // --- ONDA 10: PERFIS E CLOUD SYNC LISTENERS ---
  
  // Seletor de Perfis no Dashboard Header
  document.querySelectorAll('.profile-pills .profile-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.currentProfile = pill.dataset.profile;
      saveStateLocally(); // Salva localmente a mudança do perfil de visualização sem disparar trigger remoto
      updateUI();
    });
  });

  // Seletor de Responsável no formulário de Nova Tarefa (owner pills)
  document.querySelectorAll('.owner-selector-pills .owner-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.owner-selector-pills .owner-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const ownerInput = document.getElementById('task-owner');
      if (ownerInput) ownerInput.value = pill.dataset.owner;
    });
  });

  // Dropdown select de provedor de sincronização
  const syncProviderSelect = document.getElementById('sync-provider');
  if (syncProviderSelect) {
    syncProviderSelect.addEventListener('change', (e) => {
      toggleSyncFields(e.target.value);
    });
  }

  // Botão para salvar configurações de sincronização
  const btnSaveSync = document.getElementById('btn-save-sync');
  if (btnSaveSync) {
    btnSaveSync.addEventListener('click', () => {
      const provider = document.getElementById('sync-provider').value;
      const gistId = document.getElementById('sync-gist-id').value.trim();
      const gistToken = document.getElementById('sync-gist-token').value.trim();
      const firebaseUrl = document.getElementById('sync-firebase-url').value.trim();
      
      state.syncConfig = {
        provider,
        gistId,
        gistToken,
        firebaseUrl
      };
      
      saveState(); // Salva e dispara sync
      showToastNotification('Configurações Salvas', 'Configurações de sincronização foram salvas.');
      syncWithCloud(true);
    });
  }

  // Botão para forçar sincronização
  const btnTriggerSync = document.getElementById('btn-trigger-sync');
  if (btnTriggerSync) {
    btnTriggerSync.addEventListener('click', () => {
      syncWithCloud(true);
    });
  }

  // Ícone de status de sincronização (clicável para forçar sync)
  const syncStatusIcon = document.getElementById('sync-status');
  if (syncStatusIcon) {
    syncStatusIcon.addEventListener('click', () => {
      syncWithCloud(true);
    });
  }

  // Agendar sincronização periódica a cada 30 segundos
  setInterval(() => {
    syncWithCloud();
  }, 30000);

  // Agendar todas as notificações nativas via triggers na inicialização
  rescheduleAllNotificationTriggers();
});

// ==========================================
// NOVAS FUNÇÕES AUXILIARES DA NONA ONDA
// ==========================================

// Atualizar o gráfico de equilíbrio de categorias diário (Sugestão 3)
function updateCategoryBalance(todaysTasks) {
  const categoryBalanceBar = document.getElementById('category-balance-bar');
  const categoryLegends = document.getElementById('category-legends');
  if (!categoryBalanceBar || !categoryLegends) return;

  const categories = {
    trabalho: 0,
    saude: 0,
    estudo: 0,
    lazer: 0,
    domestico: 0,
    igreja: 0
  };

  const categoryLabels = {
    trabalho: 'Trabalho',
    saude: 'Saúde',
    estudo: 'Estudo',
    lazer: 'Lazer',
    domestico: 'Doméstico',
    igreja: 'Igreja'
  };

  const categoryIcons = {
    trabalho: '💼',
    saude: '💪',
    estudo: '📚',
    lazer: '☕',
    domestico: '🏠',
    igreja: '⛪'
  };

  let totalCatHours = 0;
  todaysTasks.forEach(task => {
    const cat = task.category || 'trabalho';
    if (categories[cat] !== undefined) {
      categories[cat] += parseFloat(task.duration);
      totalCatHours += parseFloat(task.duration);
    }
  });

  categoryBalanceBar.innerHTML = '';
  categoryLegends.innerHTML = '';

  if (totalCatHours === 0) {
    categoryBalanceBar.innerHTML = `<div class="cat-segment" style="width: 100%; background: rgba(255,255,255,0.05); border-radius: 4px;"></div>`;
    categoryLegends.innerHTML = `<span style="font-size: 11px; color: rgba(255,255,255,0.4);">Nenhum afazer para categorizar hoje.</span>`;
    return;
  }

  Object.keys(categories).forEach(cat => {
    const hours = categories[cat];
    if (hours > 0) {
      const pct = (hours / totalCatHours) * 100;
      const segment = document.createElement('div');
      segment.className = `cat-segment ${cat}`;
      segment.style.width = `${pct}%`;
      segment.title = `${categoryLabels[cat]}: ${hours.toFixed(1)}h (${pct.toFixed(0)}%)`;
      categoryBalanceBar.appendChild(segment);

      const legend = document.createElement('div');
      legend.className = 'cat-legend-item';
      legend.innerHTML = `
        <span class="cat-legend-dot ${cat}"></span>
        <span>${categoryIcons[cat]} ${categoryLabels[cat]}: <strong>${hours.toFixed(1).replace('.0', '')}h</strong></span>
      `;
      categoryLegends.appendChild(legend);
    }
  });
}

// Renderizar Habit Tracker semanal e Streaks (Sugestão 2)
function renderHabitTracker() {
  const barChartContainer = document.getElementById('bar-chart-container');
  const streakCountEl = document.getElementById('streak-count');
  if (!barChartContainer || !streakCountEl) return;

  const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();

  let chartHtml = '';
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dates.push(d);
  }

  dates.forEach(d => {
    const dateStr = formatDateString(d);
    const dayOfWeek = d.getDay();
    const dayTasks = getTasksForDate(dateStr);
    
    const totalTasks = dayTasks.length;
    const completedTasks = dayTasks.filter(t => {
      return t.type === 'fixed' ? !!t.completed[dateStr] : !!t.completedToday;
    }).length;

    const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    chartHtml += `
      <div class="chart-column">
        <span class="chart-val">${percentage}%</span>
        <div class="chart-bar-outer">
          <div class="chart-fill" style="height: ${percentage}%"></div>
        </div>
        <span class="chart-label">${dayNamesShort[dayOfWeek]}</span>
      </div>
    `;
  });
  barChartContainer.innerHTML = chartHtml;

  // Calcular Streak consecutiva de tarefas fixas
  let streak = 0;
  let streakBroken = false;
  let dayOffset = 0;

  while (!streakBroken && dayOffset < 30) {
    const d = new Date();
    d.setDate(today.getDate() - dayOffset);
    const dateStr = formatDateString(d);
    const dayOfWeek = d.getDay();

    const fixedTasks = state.tasks.filter(t => {
      return t.type === 'fixed' && t.weekdays.includes(dayOfWeek);
    });

    if (fixedTasks.length > 0) {
      const allCompleted = fixedTasks.every(t => !!t.completed[dateStr]);
      if (allCompleted) {
        streak++;
      } else {
        if (dayOffset > 0) {
          streakBroken = true;
        }
      }
    }
    dayOffset++;
  }

  streakCountEl.innerText = `${streak} ${streak === 1 ? 'dia' : 'dias'}`;
}

// Calcular e exibir Débito de Sono semanal (Sugestão 5)
function renderSleepDebt() {
  const sleepDebtCard = document.getElementById('sleep-debt-card');
  const sleepDebtText = document.getElementById('sleep-debt-text');
  if (!sleepDebtCard || !sleepDebtText) return;

  const today = new Date();
  let totalSleep = 0;
  
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = formatDateString(d);
    const stats = calculateSleepAndRestForDate(dateStr);
    totalSleep += stats.sleepHours;
  }

  const targetSleepTotal = state.sleepTarget * 7;
  const debt = targetSleepTotal - totalSleep;

  if (debt > 1) {
    sleepDebtCard.style.display = 'block';
    sleepDebtText.innerHTML = `
      Você acumulou <strong>${debt.toFixed(1).replace('.0', '')}h</strong> de débito de sono nos últimos 7 dias (Meta: ${targetSleepTotal}h, Dormido: ${totalSleep.toFixed(1)}h).<br><br>
      💤 <strong>Recomendação Flow:</strong> Seu corpo precisa recuperar energia! Tente programar seu horário de ir dormir <strong>1 hora mais cedo hoje</strong> para diminuir o débito de sono e evitar cansaço.
    `;
  } else {
    sleepDebtCard.style.display = 'none';
  }
}

// Atrasar tarefas pendentes de hoje (Sugestão 4)
function delayUpcomingTasks(minutes) {
  const now = new Date();
  const currentDateStr = formatDateString(now);
  
  if (state.selectedDate !== currentDateStr) {
    showToastNotification('Aviso', 'Você só pode atrasar compromissos no dia de hoje.');
    return;
  }

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const nowInMinutes = currentHour * 60 + currentMinute;

  let shiftedCount = 0;
  
  state.tasks = state.tasks.map(task => {
    const isToday = task.type === 'fixed'
      ? task.weekdays.includes(now.getDay())
      : task.date === currentDateStr;

    if (!isToday || !task.time) return task;

    const isCompleted = task.type === 'fixed'
      ? !!task.completed[currentDateStr]
      : !!task.completedToday;

    if (isCompleted) return task;

    const [th, tm] = task.time.split(':').map(Number);
    const taskStartMin = th * 60 + tm;
    
    // Adiamos tarefas futuras ou que deveriam ter começado nas últimas 2 horas
    if (taskStartMin > nowInMinutes - 120) {
      const newStartMin = (taskStartMin + minutes) % 1440;
      const newH = Math.floor(newStartMin / 60);
      const newM = newStartMin % 60;
      const newTimeStr = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
      
      shiftedCount++;
      return {
        ...task,
        time: newTimeStr
      };
    }
    
    return task;
  });

  if (shiftedCount > 0) {
    saveState();
    updateUI();
    showToastNotification('Agenda Ajustada!', `${shiftedCount} compromisso(s) adiado(s) em +${minutes} min.`);
  } else {
    showToastNotification('Nenhuma tarefa', 'Não encontramos compromissos pendentes hoje para adiar.');
  }
}
