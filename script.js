// Elementos da interface
const horarioAtual = document.getElementById('horarioAtual');
const primeiraEntradaBtn = document.getElementById('primeiraEntrada');
const primeiraSaidaBtn = document.getElementById('primeiraSaida');
const segundaEntradaBtn = document.getElementById('segundaEntrada');
const segundaSaidaBtn = document.getElementById('segundaSaida');
const outroBtn = document.getElementById('outro');
const listaRegistros = document.getElementById('listaRegistros');
const exportarTxtBtn = document.getElementById('exportarTxt');
const modal = document.getElementById('modal');
const modalEdicao = document.getElementById('modalEdicao');
const closeModal = document.querySelector('.close');
const closeModalEdicao = document.querySelector('.close-edicao');
const confirmarPonto = document.getElementById('confirmarPonto');
const descricaoPonto = document.getElementById('descricaoPonto');

// Array para armazenar os registros
let registros = [];

// Atualiza o relógio em tempo real
function atualizarRelogio() {
    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString('pt-BR');
    horarioAtual.textContent = horaFormatada;
}

// Formata a data para exibição
function formatarDataHora(data) {
    return data.toLocaleString('pt-BR');
}

// Adiciona um novo registro
function adicionarRegistro(tipo, descricao = '') {
    const agora = new Date();
    const registro = {
        dataHora: agora,
        tipo: tipo,
        descricao: descricao || tipo
    };
    
    registros.push(registro);
    salvarRegistros();
    atualizarListaRegistros();
}

// Salva os registros no localStorage
function salvarRegistros() {
    const hoje = new Date().toISOString().split('T')[0];
    const chave = `ponto_eletronico_${hoje}`;
    localStorage.setItem(chave, JSON.stringify(registros));
}

// Carrega os registros do localStorage
function carregarRegistros() {
    const hoje = new Date().toISOString().split('T')[0];
    const chave = `ponto_eletronico_${hoje}`;
    const registrosSalvos = localStorage.getItem(chave);
    
    if (registrosSalvos) {
        registros = JSON.parse(registrosSalvos).map(reg => ({
            ...reg,
            dataHora: new Date(reg.dataHora)
        }));
        atualizarListaRegistros();
    }
}

// Atualiza a lista de registros na tela
function atualizarListaRegistros() {
    listaRegistros.innerHTML = '';
    
    if (registros.length === 0) {
        listaRegistros.innerHTML = '<p>Nenhum registro encontrado para hoje.</p>';
        return;
    }
    
    registros.forEach((registro, index) => {
        const item = document.createElement('div');
        item.className = 'registro-item';
        item.dataset.index = index;
        item.innerHTML = `
            <span class="horario">${registro.dataHora.toLocaleTimeString('pt-BR')}</span>
            <span class="descricao">${registro.descricao}</span>
            <div class="acoes">
                <button class="btn-editar" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-excluir" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        listaRegistros.appendChild(item);
    });

    // Adiciona eventos aos botões
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            abrirModalEdicao(index);
        });
    });

    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            if (confirm('Tem certeza que deseja excluir este registro?')) {
                excluirRegistro(index);
            }
        });
    });
}

// Abre o modal para edição do registro
function abrirModalEdicao(index) {
    const registro = registros[index];
    const modalEdicao = document.getElementById('modalEdicao');
    const dataHoraInput = document.getElementById('dataHoraEdicao');
    const descricaoEdicao = document.getElementById('descricaoEdicao');
    const salvarEdicao = document.getElementById('salvarEdicao');
    const cancelarEdicao = document.getElementById('cancelarEdicao');
    
    // Formata a data para o input datetime-local
    const dataHora = new Date(registro.dataHora);
    const timezoneOffset = dataHora.getTimezoneOffset() * 60000; // em milissegundos
    const localISOTime = (new Date(dataHora - timezoneOffset)).toISOString().slice(0, 16);
    
    dataHoraInput.value = localISOTime;
    descricaoEdicao.value = registro.descricao;
    
    // Remove eventos anteriores para evitar duplicação
    const novaSalvarEdicao = salvarEdicao.cloneNode(true);
    const novoCancelarEdicao = cancelarEdicao.cloneNode(true);
    
    salvarEdicao.parentNode.replaceChild(novaSalvarEdicao, salvarEdicao);
    cancelarEdicao.parentNode.replaceChild(novoCancelarEdicao, cancelarEdicao);
    
    // Adiciona os novos eventos
    novaSalvarEdicao.addEventListener('click', () => {
        const novaDataHora = new Date(dataHoraInput.value);
        const novaDescricao = descricaoEdicao.value.trim();
        
        if (novaDescricao) {
            editarRegistro(index, novaDataHora, novaDescricao);
            modalEdicao.style.display = 'none';
        } else {
            alert('Por favor, preencha a descrição.');
        }
    });
    
    novoCancelarEdicao.addEventListener('click', () => {
        modalEdicao.style.display = 'none';
    });
    
    modalEdicao.style.display = 'block';
    descricaoEdicao.focus();
}

// Edita um registro existente
function editarRegistro(index, novaDataHora, novaDescricao) {
    registros[index] = {
        dataHora: novaDataHora,
        tipo: registros[index].tipo,
        descricao: novaDescricao
    };
    salvarRegistros();
    atualizarListaRegistros();
}

// Exclui um registro
function excluirRegistro(index) {
    registros.splice(index, 1);
    salvarRegistros();
    atualizarListaRegistros();
}

// Exporta os registros para um arquivo de texto
function exportarParaTxt() {
    if (registros.length === 0) {
        alert('Não há registros para exportar!');
        return;
    }
    
    let conteudo = 'Registros de Ponto Eletrônico\n';
    conteudo += 'Data: ' + new Date().toLocaleDateString('pt-BR') + '\n\n';
    
    registros.forEach(registro => {
        conteudo += `${registro.dataHora.toLocaleString('pt-BR')} - ${registro.descricao}\n`;
    });
    
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ponto_eletronico_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event Listeners
primeiraEntradaBtn.addEventListener('click', () => adicionarRegistro('Primeira Entrada'));
primeiraSaidaBtn.addEventListener('click', () => adicionarRegistro('Primeira Saída'));
segundaEntradaBtn.addEventListener('click', () => adicionarRegistro('Segunda Entrada'));
segundaSaidaBtn.addEventListener('click', () => adicionarRegistro('Segunda Saída'));

outroBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    descricaoPonto.focus();
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    descricaoPonto.value = '';
});

confirmarPonto.addEventListener('click', () => {
    const descricao = descricaoPonto.value.trim();
    if (descricao) {
        adicionarRegistro('Outro', descricao);
        modal.style.display = 'none';
        descricaoPonto.value = '';
    }
});

descricaoPonto.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        confirmarPonto.click();
    }
});

exportarTxtBtn.addEventListener('click', exportarParaTxt);

// Fechar o modal ao clicar fora dele
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Inicialização
setInterval(atualizarRelogio, 1000);
atualizarRelogio();
carregarRegistros();
