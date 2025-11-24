// Elementos da interface
const horarioAtual = document.getElementById('horarioAtual');
const registrarPontoBtn = document.getElementById('registrarPonto');
const listaRegistros = document.getElementById('listaRegistros');
const exportarTxtBtn = document.getElementById('exportarTxt');
const saldoHorasElement = document.getElementById('saldoHoras');
const modalEdicao = document.getElementById('modalEdicao');
const closeModalEdicao = document.querySelector('.close-edicao');

// Array para armazenar os registros
let registros = [];
let indiceEmEdicao = null; // IA
let salvarTimeout = null; // IA

// Atualiza o relógio em tempo real
function atualizarRelogio() {
    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString('pt-BR');
    horarioAtual.textContent = horaFormatada;

    // Atualiza o saldo em tempo real
    calcularSaldoHoras();
}

// Formata a data para exibição
function formatarDataHora(data) {
    return data.toLocaleString('pt-BR');
}

// Determina o próximo tipo de registro com base no último registro
function determinarProximoTipo() {
    if (registros.length === 0) return 'Primeira Entrada';

    const ultimoRegistro = registros[registros.length - 1].tipo;

    switch (ultimoRegistro) {
        case 'Primeira Entrada': return 'Primeira Saída';
        case 'Primeira Saída': return 'Segunda Entrada';
        case 'Segunda Entrada': return 'Segunda Saída';
        case 'Segunda Saída': return 'Primeira Entrada';
        default: return 'Primeira Entrada';
    }
}

// Atualiza o texto do botão com base no próximo tipo de registro
function atualizarTextoBotao() {
    const proximoTipo = determinarProximoTipo();
    registrarPontoBtn.textContent = `Registrar ${proximoTipo}`;

    // Atualiza a classe do botão para refletir se é entrada ou saída
    registrarPontoBtn.className = 'btn-registrar ' +
        (proximoTipo.includes('Entrada') ? 'entrada' : 'saida');
}

// Adiciona um novo registro
function adicionarRegistro(tipo = null, descricao = '') {
    const proximoTipo = tipo || determinarProximoTipo();
    const agora = new Date();

    // Se for o primeiro registro do dia, limpa registros antigos
    if (registros.length === 0) {
        const hoje = new Date().toISOString().split('T')[0];
        const chave = `ponto_eletronico_${hoje}`;
        localStorage.setItem(chave, JSON.stringify([]));
    }

    const registro = {
        dataHora: agora,
        tipo: proximoTipo,
        descricao: descricao || proximoTipo
    };

    registros.push(registro);
    salvarRegistrosDebounce();
    atualizarListaRegistros();
    atualizarTextoBotao();

}

// Salva os registros no localStorage
function salvarRegistrosDireto() {
    const hoje = new Date().toISOString().split('T')[0];
    const chave = `ponto_eletronico_${hoje}`;
    localStorage.setItem(chave, JSON.stringify(registros));
}

// Salva os registros com debounce
function salvarRegistrosDebounce() {
    clearTimeout(salvarTimeout);
    salvarTimeout = setTimeout(() => {
        salvarRegistrosDireto();
    }, 500); // 500ms = meio segundo de atraso
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

    // Atualiza o texto do botão ao carregar os registros
    atualizarTextoBotao();
}

// Atualiza a lista de registros na tela
function atualizarListaRegistros() {
    listaRegistros.innerHTML = '';

    if (registros.length === 0) {
        listaRegistros.innerHTML = '<p>Nenhum registro encontrado para hoje.</p>';
        calcularSaldoHoras(); // Atualiza o saldo mesmo sem registros
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

    // Atualiza o saldo de horas
    calcularSaldoHoras();

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
    const dataHoraInput = document.getElementById('dataHoraEdicao');
    const descricaoEdicao = document.getElementById('descricaoEdicao');

    // Formata a data para o input datetime-local
    const dataHora = new Date(registro.dataHora);
    const timezoneOffset = dataHora.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dataHora - timezoneOffset)).toISOString().slice(0, 16);

    dataHoraInput.value = localISOTime;
    descricaoEdicao.value = registro.descricao;

    // Define o índice em edição
    indiceEmEdicao = index;

    // Exibe o modal
    modalEdicao.style.display = 'block';
    descricaoEdicao.focus();
}

document.getElementById('salvarEdicao').addEventListener('click', () => {
    if (indiceEmEdicao === null) return;

    const dataHoraInput = document.getElementById('dataHoraEdicao');
    const descricaoEdicao = document.getElementById('descricaoEdicao');

    const novaDataHora = new Date(dataHoraInput.value);
    const novaDescricao = descricaoEdicao.value.trim();

    if (novaDescricao) {
        editarRegistro(indiceEmEdicao, novaDataHora, novaDescricao);
        modalEdicao.style.display = 'none';
        indiceEmEdicao = null; // Reseta
    } else {
        alert('Por favor, preencha a descrição.');
    }
});

document.getElementById('cancelarEdicao').addEventListener('click', () => {
    modalEdicao.style.display = 'none';
    indiceEmEdicao = null;
});

// Edita um registro existente
function editarRegistro(index, novaDataHora, novaDescricao) {
    // Garante que a data é válida (IA)
    if (isNaN(novaDataHora.getTime())) {
        alert('Data/hora inválida.');
        return;
    }

    registros[index] = {
        dataHora: novaDataHora,
        tipo: registros[index].tipo,
        descricao: novaDescricao
    };

    // Reatribui os tipos de forma sequencial para manter consistência (IA)
    const tiposSequenciais = ['Primeira Entrada', 'Primeira Saída', 'Segunda Entrada', 'Segunda Saída'];
    registros.forEach((reg, i) => {
        reg.tipo = tiposSequenciais[i % tiposSequenciais.length];
    });

    salvarRegistrosDebounce();
    atualizarListaRegistros();
}

// Exclui um registro
function excluirRegistro(index) {
    registros.splice(index, 1);
    salvarRegistrosDebounce();
    atualizarListaRegistros();
}

// Função auxiliar para calcular o tempo trabalhado
function calcularTempoTrabalhado(listaRegistros) {
    let tempoTrabalhadoMs = 0;
    let ultimoTipo = '';
    let ultimoHorario = null;

    // Ordena os registros por data/hora
    const registrosOrdenados = [...listaRegistros].sort((a, b) => a.dataHora - b.dataHora);

    // Filtra apenas os registros de entrada/saída
    const registrosPonto = registrosOrdenados.filter(reg =>
        ['Primeira Entrada', 'Primeira Saída', 'Segunda Entrada', 'Segunda Saída'].includes(reg.tipo)
    );

    registrosPonto.forEach(registro => {
        if (registro.tipo === 'Primeira Entrada' || registro.tipo === 'Segunda Entrada') {
            ultimoHorario = registro.dataHora;
            ultimoTipo = 'entrada';
        } else if ((registro.tipo === 'Primeira Saída' || registro.tipo === 'Segunda Saída') && ultimoTipo === 'entrada') {
            if (ultimoHorario) {
                const periodo = registro.dataHora - ultimoHorario;
                tempoTrabalhadoMs += periodo;
                ultimoHorario = null;
                ultimoTipo = 'saida';
            }
        }
    });

    // Se está em um período de trabalho ativo (entrada sem saída)
    if (ultimoHorario && ultimoTipo === 'entrada') {
        const agora = new Date();
        const periodoAtual = agora - ultimoHorario;
        tempoTrabalhadoMs += periodoAtual;
    }

    return { tempoTrabalhadoMs, ultimoHorario, ultimoTipo };
}

// Função para calcular o saldo de horas
function calcularSaldoHoras() {
    const sugestaoSaidaElement = document.getElementById('sugestaoSaida');
    const oitoHorasMs = 8 * 60 * 60 * 1000; // 8 horas em milissegundos

    // Ordena os registros por data/hora
    const registrosOrdenados = [...registros].sort((a, b) => a.dataHora - b.dataHora);

    // Filtra apenas os registros de entrada/saída
    const registrosPonto = registrosOrdenados.filter(reg =>
        ['Primeira Entrada', 'Primeira Saída', 'Segunda Entrada', 'Segunda Saída'].includes(reg.tipo)
    );

    // Se não há registros suficientes, retorna
    if (registrosPonto.length < 2) {
        saldoHorasElement.textContent = '--:--';
        saldoHorasElement.className = '';
        sugestaoSaidaElement.textContent = '';
        return;
    }

    // Calcula o tempo trabalhado usando a função auxiliar
    const dadosCalculados = calcularTempoTrabalhado(registros);
    const tempoTrabalhadoMs = dadosCalculados.tempoTrabalhadoMs;
    const ultimoHorario = dadosCalculados.ultimoHorario;
    const ultimoTipo = dadosCalculados.ultimoTipo;

    // Recria periodosTrabalhados apenas para a lógica de sugestão (se necessário) ou simplifica
    // Para manter a lógica original da sugestão de saída, precisamos saber se estamos trabalhando
    // A função auxiliar já retorna ultimoHorario e ultimoTipo que é o que precisamos para saber se está ativo

    // Calcula o saldo
    const saldoMs = tempoTrabalhadoMs - oitoHorasMs;

    // Formata o saldo
    const horas = Math.floor(Math.abs(saldoMs) / (1000 * 60 * 60));
    const minutos = Math.floor((Math.abs(saldoMs) % (1000 * 60 * 60)) / (1000 * 60));
    const sinal = saldoMs >= 0 ? '+' : '-';
    const saldoFormatado = `${sinal}${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;

    // Atualiza o elemento de saldo
    saldoHorasElement.textContent = saldoFormatado;

    // Aplica a classe de estilo apropriada
    saldoHorasElement.className = '';
    if (saldoMs > 0) {
        saldoHorasElement.classList.add('saldo-positivo');
    } else if (saldoMs < 0) {
        saldoHorasElement.classList.add('saldo-negativo');
    } else {
        saldoHorasElement.classList.add('saldo-zerado');
    }

    // Calcula e exibe a sugestão de saída
    if (ultimoHorario && ultimoTipo === 'entrada') {
        // Tempo restante para completar 8 horas
        const tempoRestanteMs = Math.max(0, oitoHorasMs - tempoTrabalhadoMs);

        if (tempoRestanteMs > 0) {
            // Calcula a hora de saída sugerida
            const agora = new Date();
            const horaSugerida = new Date(agora.getTime() + tempoRestanteMs);
            const horaFormatada = horaSugerida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            sugestaoSaidaElement.textContent = `Sugestão de saída: ${horaFormatada} (8h completas)`;
        } else {
            sugestaoSaidaElement.textContent = 'Já completou as 8h de trabalho';
        }
    } else {
        sugestaoSaidaElement.textContent = '';
    }
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

    // Adiciona o resumo das horas
    const { tempoTrabalhadoMs } = calcularTempoTrabalhado(registros);
    const horasTrabalhadas = Math.floor(tempoTrabalhadoMs / (1000 * 60 * 60));
    const minutosTrabalhados = Math.floor((tempoTrabalhadoMs % (1000 * 60 * 60)) / (1000 * 60));
    const totalFormatado = `${horasTrabalhadas.toString().padStart(2, '0')}:${minutosTrabalhados.toString().padStart(2, '0')}`;

    conteudo += `\nTotal de horas: ${totalFormatado}\n`;

    const oitoHorasMs = 8 * 60 * 60 * 1000;
    if (tempoTrabalhadoMs > oitoHorasMs) {
        conteudo += 'Status: Acima de 8 horas diárias';
    } else if (tempoTrabalhadoMs < oitoHorasMs) {
        conteudo += 'Status: Abaixo de 8 horas diárias';
    } else {
        conteudo += 'Status: Exatamente 8 horas diárias';
    }

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
registrarPontoBtn.addEventListener('click', () => {
    adicionarRegistro();
});

// Fecha o modal de edição ao clicar fora dele
window.addEventListener('click', (event) => {
    if (event.target === modalEdicao) {
        modalEdicao.style.display = 'none';
    }
});

// Fecha o modal de edição
closeModalEdicao.addEventListener('click', () => {
    modalEdicao.style.display = 'none';
});

// Exporta para TXT
exportarTxtBtn.addEventListener('click', exportarParaTxt);

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarRegistros();
    setInterval(atualizarRelogio, 1000);
    atualizarRelogio();
});
