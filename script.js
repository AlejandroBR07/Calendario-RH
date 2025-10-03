// --- LÓGICA DE USUÁRIO ---
        // A variável `sessaoAtual` será preenchida com o email do usuário logado.
        // Para testar como admin, substitua a linha abaixo por:
        // let sessaoAtual = { getSetor: () => "RH" };
        let sessaoAtual = "{{user.email}}";


        class Colaborador{
            #id; #nome; #funcao; #email; #isLider; #tag; #setor; #feedback; #notaMedia; #notaMediaAntiga; #numAvaliacoesRecebidas; #numAvaliacoes; #notaTotal;
            constructor(id, nome, email, funcao, setor, notaTotal, numAvaliacoesRecebidas, numAvaliacoes, notaMediaAntiga, tag , isLider=false){
                this.#id = id; this.#nome = nome; this.#email = email; this.#funcao = funcao; this.#isLider = isLider; this.#notaTotal = notaTotal; this.#setor = setor; this.#numAvaliacoesRecebidas = numAvaliacoesRecebidas; this.#notaMedia = notaTotal / numAvaliacoesRecebidas; this.#numAvaliacoes = numAvaliacoes; this.#notaMediaAntiga = notaMediaAntiga; this.#tag = tag;
            }
            diminuirAvaliações(){ this.#numAvaliacoes = this.#numAvaliacoes -1; }
            aumentarAvaliaçõesRecebidas(){ this.#numAvaliacoesRecebidas += 1; }
            aumentarNotaTotal(num){ this.#notaTotal += num; }
            getId(){ return this.#id }
            getNome(){ let nome = this.#nome; return nome; }
            getNumAvaliacoes(){ return this.#numAvaliacoes; }
            setId(id){ this.#id = id; }
            setFeedback(feedback){ this.#feedback = feedback; }
            setMedia(){ this.#notaMedia = this.#notaTotal / this.#numAvaliacoesRecebidas; }
            setNumAvaliacoes(numAvaliacoes){ this.#numAvaliacoes = numAvaliacoes; }
            setEmail(email){ this.#email = email; }
            setNotaAntiga(){ this.#notaMediaAntiga = this.#notaTotal; }
            getNotaAntiga(){ return this.#notaMediaAntiga; }
            getMedia(){ this.setMedia(); return this.#notaMedia; }
            getIsLider(){ return this.#isLider; }
            getSetor(){ return this.#setor; }
            getEmail(){ return this.#email; }
            getNumAvaliacoesRecebidas(){ return this.#numAvaliacoesRecebidas; }
            getNotaTotal(){ return this.#notaTotal; }
            getFuncao(){ return this.#funcao; }
            getTag(){ return this.#tag; }
        }

        async function buscarUsuario() {
            // Se `sessaoAtual` for um objeto (para teste), não busca no banco.
            if (typeof sessaoAtual === 'object' && sessaoAtual !== null) {
                return;
            }
            const { data, error } = await supabase
                .from('pessoas')
                .select('*')
                .like('email', sessaoAtual);

            if (error) {
                console.error('Erro:', error);
            } else if (data && data.length > 0) {
                const linha = data[0];
                sessaoAtual = new Colaborador(linha.id, linha.nome, linha.email, linha.funcao, linha.setor, linha.notaTotal, linha.numAvaliacoesRecebidas, linha.numavaliacoes, linha.getNotaTotalAntiga, linha.tag, linha.islider)
            } else {
                // Define um usuário padrão caso não encontre no banco
                sessaoAtual = { getSetor: () => 'Visitante' };
            }
        }

        window.openModal = openModal;
        window.closeModal = closeModal;
        window.navigateMonth = navigateMonth;
        window.filterEvents = filterEvents;
        window.editEvent = editEvent;
        window.openDeleteConfirmModal = openDeleteConfirmModal;
        window.handleSubmit = handleSubmit;
        window.selectColor = selectColor;

        import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

        const supabaseUrl = 'https://fxlygqcrfciegqmodmav.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHlncWNyZmNpZWdxbW9kbWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDk4NzYsImV4cCI6MjA2NjI4NTg3Nn0.o30PBOx-b2WlhDePjOLjP3A-0eVeHnGpGLGGgC8kAJM';
        const supabase = createClient(supabaseUrl, supabaseKey);


        // Estado global
        let currentDate = new Date();
        let events = [];
        let nationalHolidays = [];
        let selectedDate = null;
        let editingEvent = null;
        let selectedColor = null;
        let filteredEvents = [];
        let modalForm, modalViewContent, confirmDeleteModal;

        // Configurações das categorias
        const categoryConfig = {
            'evento': { label: '🎉 Evento', color: '#3b82f6' },
            'aniversario': { label: '🎂 Aniversário', color: '#f59e0b' },
            'evento-interno': { label: '🏢 Evento Interno', color: '#10b981' },
            'data-comemorativa': { label: '🎊 Data Comemorativa', color: '#ef4444' },
            'reuniao': { label: '👥 Reunião', color: '#8b5cf6' },
            'feriado': { label: '🇧🇷 Feriado Nacional', color: '#22c55e' },
        };

        // Inicialização
        document.addEventListener('DOMContentLoaded', async function() {
            modalForm = document.getElementById('modalForm');
            modalViewContent = document.getElementById('modalViewContent');
            confirmDeleteModal = document.getElementById('confirmDeleteModalOverlay');

            await buscarUsuario();
            await Promise.all([
                loadEventsFromSupabase(),
                loadNationalHolidays()
            ]);

            renderCalendar();
            updateTodayEvents();
            updateUpcomingEvents();

            // Listeners para o modal de confirmação
            document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
            document.getElementById('cancelDeleteBtn').addEventListener('click', () => confirmDeleteModal.classList.add('hidden'));
            confirmDeleteModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    confirmDeleteModal.classList.add('hidden');
                }
            });
        });

        async function loadEventsFromSupabase() {
            const { data, error } = await supabase.from('eventos').select('*');
            if (error) {
                console.error('Erro ao buscar eventos:', error);
                showNotification('Não foi possível carregar os eventos.', 'error');
                return;
            }
            events = data;
            combineAllEvents();
        }

        async function loadNationalHolidays() {
            const year = currentDate.getFullYear();
            try {
                const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
                if (!response.ok) throw new Error('Falha ao buscar feriados');
                const holidays = await response.json();
                nationalHolidays = holidays.map(holiday => ({
                    id: `feriado-${holiday.date}`,
                    title: holiday.name,
                    date: holiday.date,
                    category: 'feriado',
                    isHoliday: true // Flag para identificar feriados
                }));
                combineAllEvents();
            } catch (error) {
                console.error('Erro ao buscar feriados nacionais:', error);
                showNotification('Não foi possível carregar os feriados nacionais.', 'error');
            }
        }

        function combineAllEvents() {
            // Combina eventos do Supabase e feriados, garantindo que não haja duplicatas de feriados
            const allEvents = [...events, ...nationalHolidays];
            const uniqueEvents = allEvents.reduce((acc, current) => {
                const x = acc.find(item => item.id === current.id);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, []);
            filteredEvents = [...uniqueEvents];
        }

        // Abrir modal (agora com modo de edição/visualização)
        function openModal(event = null) {
            const modal = document.getElementById('modalOverlay');
            const title = document.getElementById('modalTitle');
            const isAdmin = sessaoAtual.getSetor() === "RH" || sessaoAtual.getSetor() === "Comunicação" || sessaoAtual.getSetor() === "CEO";

            if (event) { // Visualizando ou Editando um evento existente
                editingEvent = event;
                title.textContent = event.title;

                // Se for um feriado, sempre mostrar o modo de visualização, mesmo para admins
                if (event.isHoliday) {
                    modalForm.style.display = 'none';
                    modalViewContent.style.display = 'flex';

                    const categoryInfo = categoryConfig[event.category];
                    const eventColor = event.customColor || categoryInfo?.color || '#6b7280';
                    const categoryTagStyle = `background: linear-gradient(135deg, ${eventColor} 0%, ${darkenColor(eventColor, 20)} 100%);`;
                    const formattedDate = new Date(event.date + 'T00:00:00-03:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

                    modalViewContent.innerHTML = `
                        <div class="view-header">Feriado Nacional - ${formattedDate}</div>
                        <div class="view-details">
                            <span class="view-category-tag" style="${categoryTagStyle}">${categoryInfo?.label || event.category}</span>
                            <p class="view-description">${event.title} é um feriado nacional no Brasil.</p>
                        </div>
                        <div class="view-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Fechar</button>
                        </div>
                    `;
                } else if (isAdmin) {
                    modalViewContent.style.display = 'none';
                    modalForm.style.display = 'grid';

                    document.getElementById('eventTitle').value = event.title;
                    document.getElementById('eventDate').value = event.date;
                    document.getElementById('eventTime').value = event.time || '';
                    document.getElementById('eventCategory').value = event.category;
                    document.getElementById('eventDescription').value = event.description || '';
                    document.getElementById('deleteBtn').style.display = 'inline-block';
                    document.getElementById('submitBtn').textContent = 'Salvar Alterações';

                    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
                    if (event.customColor) {
                        selectColor(event.customColor);
                    } else {
                        selectedColor = null;
                    }
                } else {
                    modalForm.style.display = 'none';
                    modalViewContent.style.display = 'flex';

                    // Lógica para texto dinâmico
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const eventDate = new Date(event.date + 'T00:00:00');
                    eventDate.setHours(0, 0, 0, 0);

                    const dayDiff = (eventDate - today) / (1000 * 60 * 60 * 24);

                    let dateText = '';
                    if (event.category === 'aniversario') {
                        if (dayDiff === 0) dateText = `O aniversário de ${event.title} é hoje! 🎉`;
                        else if (dayDiff === 1) dateText = `O aniversário de ${event.title} é amanhã!`;
                        else dateText = `Aniversário de ${event.title}`;
                    } else {
                        if (dayDiff === 0) dateText = `É hoje${event.time ? ` às ${event.time}` : ''}!`;
                        else if (dayDiff === 1) dateText = `É amanhã${event.time ? ` às ${event.time}` : ''}!`;
                        else {
                            const formattedDate = new Date(event.date + 'T00:00:00-03:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
                            dateText = `Acontece em ${formattedDate}${event.time ? ` às ${event.time}` : ''}.`;
                        }
                    }

                    const categoryInfo = categoryConfig[event.category];
                    const eventColor = event.customColor || categoryInfo?.color || '#6b7280';
                    const categoryTagStyle = `background: linear-gradient(135deg, ${eventColor} 0%, ${darkenColor(eventColor, 20)} 100%);`;

                    modalViewContent.innerHTML = `
                        <div class="view-header">${dateText}</div>
                        <div class="view-details">
                            <span class="view-category-tag" style="${categoryTagStyle}">${categoryInfo?.label || event.category}</span>
                            <p class="view-description">${event.description || 'Nenhuma descrição fornecida.'}</p>
                        </div>
                        <div class="view-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Fechar</button>
                        </div>
                    `;
                }
            } else { // Criando um novo evento
                if (!isAdmin) {
                    showNotification('Você não tem permissão para criar eventos.', 'error');
                    return;
                }

                editingEvent = null;
                title.textContent = 'Novo Evento';
                modalViewContent.style.display = 'none';
                modalForm.style.display = 'grid';
                modalForm.reset();
                document.getElementById('eventDate').value = selectedDate ? formatDate(selectedDate) : '';
                document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
                selectedColor = null;
                document.getElementById('deleteBtn').style.display = 'none';
                document.getElementById('submitBtn').textContent = 'Criar Evento';
            }
            modal.classList.remove('hidden');
        }

        function selectColor(color) {
            selectedColor = color;
            document.querySelectorAll('.color-option').forEach(option => {
                option.classList.remove('selected');
            });
            const selectedOption = document.querySelector(`[data-color="${color}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        }

        function renderCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            document.getElementById('monthTitle').textContent = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const calendarGrid = document.getElementById('calendarGrid');
            const dayElements = calendarGrid.querySelectorAll('.day-cell');
            dayElements.forEach(el => el.remove());
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();

            for (let i = 0; i < startingDayOfWeek; i++) {
                createDayCell(new Date(year, month, i - startingDayOfWeek + 1), true);
            }
            for (let day = 1; day <= daysInMonth; day++) {
                createDayCell(new Date(year, month, day), false);
            }
            const totalCells = calendarGrid.children.length - 7;
            const remainingCells = 42 - totalCells;
            for (let day = 1; day <= remainingCells; day++) {
                createDayCell(new Date(year, month + 1, day), true);
            }
            updateTodayEvents();
            updateUpcomingEvents();
        }

        function createDayCell(date, isOtherMonth) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            if (isOtherMonth) dayCell.classList.add('other-month');
            if (date.toDateString() === new Date().toDateString()) dayCell.classList.add('today');

            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = date.getDate();
            dayCell.appendChild(dayNumber);

            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'events-container';
            const dayEvents = getEventsForDate(date, filteredEvents);
            dayEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = `event-item`;
                eventElement.setAttribute('data-event-id', event.id);
                if (event.customColor) {
                    eventElement.style.background = `linear-gradient(135deg, ${event.customColor} 0%, ${darkenColor(event.customColor, 20)} 100%)`;
                } else {
                    eventElement.classList.add(`event-${event.category}`);
                }
                eventElement.textContent = event.title;
                eventElement.onclick = (e) => {
                    e.stopPropagation();
                    editEvent(event);
                };
                eventsContainer.appendChild(eventElement);
            });
            dayCell.appendChild(eventsContainer);
            dayCell.onclick = () => {
                selectedDate = date;
                openModal();
            };
            document.getElementById('calendarGrid').appendChild(dayCell);
        }

        function darkenColor(color, percent) {
            const num = parseInt(color.replace("#", ""), 16), amt = Math.round(2.55 * percent);
            const R = (num >> 16) - amt, G = (num >> 8 & 0x00FF) - amt, B = (num & 0x0000FF) - amt;
            return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
        }

        function getEventsForDate(date, eventsList = events) {
            return eventsList.filter(event => event.date === formatDate(date));
        }

        async function navigateMonth(direction) {
            const oldYear = currentDate.getFullYear();
            currentDate.setMonth(currentDate.getMonth() + (direction === 'prev' ? -1 : 1));
            const newYear = currentDate.getFullYear();

            if (oldYear !== newYear) {
                await loadNationalHolidays(); // Recarrega feriados se o ano mudou
            }
            renderCalendar();
        }

        function filterEvents() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            const categoryFilter = document.getElementById('categoryFilter').value;
            filteredEvents = events.filter(event => {
                const matchesSearch = !searchTerm || event.title.toLowerCase().includes(searchTerm) || (event.description && event.description.toLowerCase().includes(searchTerm));
                const matchesCategory = !categoryFilter || event.category === categoryFilter;
                return matchesSearch && matchesCategory;
            });
            renderCalendar();
        }

        function updateTodayEvents() {
            const section = document.getElementById('todayEventsSection');
            const grid = document.getElementById('todayEventsGrid');
            const titleElement = document.getElementById('dynamicEventsTitle');

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let eventsToShow = getEventsForDate(today);
            let titleText = "Eventos de Hoje";

            if (eventsToShow.length === 0) {
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                eventsToShow = getEventsForDate(tomorrow);
                titleText = "Eventos de Amanhã";
            }

            if (eventsToShow.length === 0) {
                const dayAfter = new Date(today);
                dayAfter.setDate(today.getDate() + 2);
                eventsToShow = getEventsForDate(dayAfter);
                titleText = `Eventos de ${dayAfter.toLocaleDateString('pt-BR', { weekday: 'long' })}`;
            }

            if (eventsToShow.length === 0) {
                section.classList.add('hidden');
                return;
            }

            section.classList.remove('hidden');
            titleElement.textContent = titleText;

            grid.innerHTML = eventsToShow.map(event => {
                const categoryClass = event.customColor ? '' : `event-${event.category}`;
                const categoryStyle = event.customColor ? `style="background: linear-gradient(135deg, ${event.customColor} 0%, ${darkenColor(event.customColor, 20)} 100%);"` : '';
                return `
                    <div class="today-event-card" onclick="editEvent(${JSON.stringify(event).replace(/"/g, '&quot;')})">
                        <div class="today-event-card-title">${event.title}</div>
                        ${event.time ? `<div class="today-event-card-time">🕐 ${event.time}</div>` : ''}
                        <span class="today-event-card-category ${categoryClass}" ${categoryStyle}>${categoryConfig[event.category]?.label || event.category}</span>
                        ${event.description ? `<div class="today-event-card-description">${event.description}</div>` : ''}
                    </div>`;
            }).join('');
        }

        function updateUpcomingEvents() {
            const today = new Date();
            const upcomingEvents = events.filter(event => new Date(event.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
            const container = document.getElementById('upcomingEventsList');
            if (upcomingEvents.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">Nenhum evento próximo</p>';
                return;
            }
            const eventsByCategory = upcomingEvents.reduce((acc, event) => {
                (acc[event.category] = acc[event.category] || []).push(event);
                return acc;
            }, {});
            const sortedCategories = Object.keys(eventsByCategory).sort((a, b) => new Date(eventsByCategory[a][0].date) - new Date(eventsByCategory[b][0].date));
            container.innerHTML = sortedCategories.map(category => {
                const categoryEvents = eventsByCategory[category];
                const categoryInfo = categoryConfig[category];
                return `
                    <div class="category-group">
                        <div class="category-title">${categoryInfo?.label || category}</div>
                        ${categoryEvents.map(event => {
                            const eventDate = new Date(event.date);
                            const formattedDate = eventDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', weekday: 'short' });
                            const categoryClass = event.customColor ? '' : `event-${event.category}`;
                            const categoryStyle = event.customColor ? `style="background: linear-gradient(135deg, ${event.customColor} 0%, ${darkenColor(event.customColor, 20)} 100%);"` : '';
                            return `
                                <div class="upcoming-event" onclick="editEvent(${JSON.stringify(event).replace(/"/g, '&quot;')})">
                                    <div class="upcoming-event-title">${event.title}</div>
                                    <div class="upcoming-event-date">${formattedDate}${event.time ? ` às ${event.time}` : ''}</div>
                                    <span class="upcoming-event-category ${categoryClass}" ${categoryStyle}>${categoryInfo?.label || event.category}</span>
                                </div>`;
                        }).join('')}
                    </div>`;
            }).join('');
        }

        function closeModal() {
            document.getElementById('modalOverlay').classList.add('hidden');
            editingEvent = null;
            selectedDate = null;
            selectedColor = null;
        }

        function editEvent(event) {
            // A lógica de feriado agora é tratada diretamente em openModal
            openModal(event);
        }

        function openDeleteConfirmModal() {
            if (!editingEvent) return;
            confirmDeleteModal.classList.remove('hidden');
        }

        async function confirmDelete() {
            if (!editingEvent) return;
            const { error } = await supabase.from('eventos').delete().eq('id', editingEvent.id);

            confirmDeleteModal.classList.add('hidden'); // Esconde o modal de confirmação

            if(error) {
                showNotification('Falha ao excluir evento.', 'error');
                return;
            }

            await loadEventsFromSupabase();
            renderCalendar();
            closeModal(); // Fecha o modal de edição principal
            showNotification('Evento excluído com sucesso!', 'success');
        }

        async function handleSubmit(e) {
            e.preventDefault();
            const payload = {
                title: document.getElementById('eventTitle').value.trim(),
                date: document.getElementById('eventDate').value,
                time: document.getElementById('eventTime').value || null,
                category: document.getElementById('eventCategory').value,
                description: document.getElementById('eventDescription').value.trim() || null,
                customColor: selectedColor || null,
                updatedAt: new Date().toISOString()
            };
            if (!payload.title || !payload.date || !payload.category) {
                showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
                return;
            }
            let result;
            if (editingEvent) {
                result = await supabase.from('eventos').update(payload).eq('id', editingEvent.id);
            } else {
                payload.createdAt = new Date().toISOString();
                result = await supabase.from('eventos').insert([payload]);
            }
            if (result.error) {
                showNotification(`Falha ao ${editingEvent ? 'atualizar' : 'criar'} evento.`, 'error');
                return;
            }
            showNotification(`Evento ${editingEvent ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            await loadEventsFromSupabase();
            filterEvents();
            closeModal();
        }

        function formatDate(date) { return date.toISOString().split('T')[0]; }

        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.classList.add('show'), 100);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => document.body.removeChild(notification), 300);
            }, 3000);
        }

        // Navegação por teclado
        document.addEventListener('keydown', function(e) {
            const modalVisible = !document.getElementById('modalOverlay').classList.contains('hidden');
            const confirmModalVisible = !document.getElementById('confirmDeleteModalOverlay').classList.contains('hidden');

            if (e.key === 'Escape') {
                if (confirmModalVisible) {
                    document.getElementById('confirmDeleteModalOverlay').classList.add('hidden');
                } else if (modalVisible) {
                    closeModal();
                }
            } else if (!modalVisible && !confirmModalVisible) {
                if (e.key === 'ArrowLeft') {
                    navigateMonth('prev');
                } else if (e.key === 'ArrowRight') {
                    navigateMonth('next');
                } else if (e.ctrlKey && e.key === 'n') {
                    e.preventDefault();
                    openModal();
                }
            }
        });

        document.getElementById('modalOverlay').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        // Theme Switcher Logic
        const themeToggle = document.getElementById('theme-toggle');

        function applyTheme(theme) {
            if (theme === 'dark') {
                document.body.classList.add('dark-theme');
                themeToggle.checked = true;
            } else {
                document.body.classList.remove('dark-theme');
                themeToggle.checked = false;
            }
        }

        function toggleTheme() {
            const currentTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
            localStorage.setItem('theme', currentTheme);
            applyTheme(currentTheme);
        }

        themeToggle.addEventListener('change', toggleTheme);

        // Apply saved theme on initial load
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);