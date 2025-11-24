export class PontoController {
    constructor(service) {
        this.service = service;
        this.indiceEmEdicao = null;
        this.salvarTimeout = null;

        // Elementos da UI
        this.horarioAtual = document.getElementById('horarioAtual');
        this.registrarPontoBtn = document.getElementById('registrarPonto');
        this.listaRegistros = document.getElementById('listaRegistros');
        this.exportarTxtBtn = document.getElementById('exportarTxt');
        this.saldoHorasElement = document.getElementById('saldoHoras');
        this.sugestaoSaidaElement = document.getElementById('sugestaoSaida');
        this.modalEdicao = document.getElementById('modalEdicao');
        this.closeModalEdicao = document.querySelector('.close-edicao');

        // Inputs do Modal
        this.dataHoraInput = document.getElementById('dataHoraEdicao');
        this.descricaoEdicao = document.getElementById('descricaoEdicao');
        this.salvarEdicaoBtn = document.getElementById('salvarEdicao');
        this.cancelarEdicaoBtn = document.getElementById('cancelarEdicao');

        this._inicializarEventos();
        this._iniciarRelogio();
        this.atualizarView();
    }

    _inicializarEventos() {
        this.registrarPontoBtn.addEventListener('click', () => this.adicionarRegistro());
        this.exportarTxtBtn.addEventListener('click', () => this.exportarParaTxt());

        this.closeModalEdicao.addEventListener('click', () => this.fecharModal());
        this.cancelarEdicaoBtn.addEventListener('click', () => this.fecharModal());
        this.salvarEdicaoBtn.addEventListener('click', () => this.salvarEdicao());

        window.addEventListener('click', (event) => {
            if (event.target === this.modalEdicao) {
                this.fecharModal();
            }
        });
    }

    _iniciarRelogio() {
        this.atualizarRelogio();
        setInterval(() => this.atualizarRelogio(), 1000);
    }

    atualizarRelogio() {
        const agora = new Date();
        this.horarioAtual.textContent = agora.toLocaleTimeString('pt-BR');
        this.atualizarSaldoHoras();
    }

    adicionarRegistro() {
        this.service.adicionarRegistro();
        this.atualizarView();
    }

    atualizarView() {
        this.atualizarListaRegistros();
        this.atualizarTextoBotao();
        this.atualizarSaldoHoras();
    }

    atualizarTextoBotao() {
        const proximoTipo = this.service.determinarProximoTipo();
        this.registrarPontoBtn.textContent = `Registrar ${proximoTipo}`;
        this.registrarPontoBtn.className = 'btn-registrar ' +
            (proximoTipo.includes('Entrada') ? 'entrada' : 'saida');
    }

    atualizarListaRegistros() {
        this.listaRegistros.innerHTML = '';
        const registros = this.service.obterRegistros();

        if (registros.length === 0) {
            this.listaRegistros.innerHTML = '<p>Nenhum registro encontrado para hoje.</p>';
            return;
        }

        registros.forEach((registro, index) => {
            const item = document.createElement('div');
            item.className = 'registro-item';
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

            // Adiciona listeners diretamente aos botões criados
            item.querySelector('.btn-editar').addEventListener('click', (e) => {
                e.stopPropagation();
                this.abrirModalEdicao(index);
            });

            item.querySelector('.btn-excluir').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Tem certeza que deseja excluir este registro?')) {
                    this.service.excluirRegistro(index);
                    this.atualizarView();
                }
            });

            this.listaRegistros.appendChild(item);
        });
    }

    atualizarSaldoHoras() {
        const dados = this.service.calcularDadosHoras();
        const { saldoMs, tempoTrabalhadoMs, ultimoHorario, ultimoTipo } = dados;

        // Formata o saldo
        const horas = Math.floor(Math.abs(saldoMs) / (1000 * 60 * 60));
        const minutos = Math.floor((Math.abs(saldoMs) % (1000 * 60 * 60)) / (1000 * 60));
        const sinal = saldoMs >= 0 ? '+' : '-';
        const saldoFormatado = `${sinal}${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;

        this.saldoHorasElement.textContent = saldoFormatado;

        this.saldoHorasElement.className = '';
        if (saldoMs > 0) {
            this.saldoHorasElement.classList.add('saldo-positivo');
        } else if (saldoMs < 0) {
            this.saldoHorasElement.classList.add('saldo-negativo');
        } else {
            this.saldoHorasElement.classList.add('saldo-zerado');
        }

        // Sugestão de saída
        const oitoHorasMs = 8 * 60 * 60 * 1000;
        if (ultimoHorario && ultimoTipo === 'entrada') {
            const tempoRestanteMs = Math.max(0, oitoHorasMs - tempoTrabalhadoMs);

            if (tempoRestanteMs > 0) {
                const agora = new Date();
                const horaSugerida = new Date(agora.getTime() + tempoRestanteMs);
                const horaFormatada = horaSugerida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                this.sugestaoSaidaElement.textContent = `Sugestão de saída: ${horaFormatada} (8h completas)`;
            } else {
                this.sugestaoSaidaElement.textContent = 'Já completou as 8h de trabalho';
            }
        } else {
            this.sugestaoSaidaElement.textContent = '';
        }
    }

    abrirModalEdicao(index) {
        const registro = this.service.obterRegistros()[index];

        const dataHora = new Date(registro.dataHora);
        const timezoneOffset = dataHora.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dataHora - timezoneOffset)).toISOString().slice(0, 16);

        this.dataHoraInput.value = localISOTime;
        this.descricaoEdicao.value = registro.descricao;
        this.indiceEmEdicao = index;
        this.modalEdicao.style.display = 'block';
        this.descricaoEdicao.focus();
    }

    fecharModal() {
        this.modalEdicao.style.display = 'none';
        this.indiceEmEdicao = null;
    }

    salvarEdicao() {
        if (this.indiceEmEdicao === null) return;

        const novaDataHora = new Date(this.dataHoraInput.value);
        const novaDescricao = this.descricaoEdicao.value.trim();

        if (isNaN(novaDataHora.getTime())) {
            alert('Data/hora inválida.');
            return;
        }

        if (novaDescricao) {
            this.service.editarRegistro(this.indiceEmEdicao, novaDataHora, novaDescricao);
            this.fecharModal();
            this.atualizarView();
        } else {
            alert('Por favor, preencha a descrição.');
        }
    }

    exportarParaTxt() {
        const conteudo = this.service.gerarConteudoExportacao();
        if (!conteudo) {
            alert('Não há registros para exportar!');
            return;
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
}
