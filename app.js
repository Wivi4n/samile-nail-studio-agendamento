const WHATSAPP_NUMBER = '55 87 9909-4743';
const AGENDAMENTOS_STORAGE_KEY = 'samile-agendamentos';

const form = document.querySelector('#agendamento-form');
const statusMessage = document.querySelector('#mensagem-status');
const dataInput = document.querySelector('#data');
const horarioInput = document.querySelector('#horario');

function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function criarMensagemAgendamento(dados) {
    return [
        'Olá, Samile! Gostaria de confirmar um agendamento:',
        '',
        `Nome: ${dados.nome}`,
        `Atendimento: ${dados.atendimento}`,
        `Data: ${formatarData(dados.data)}`,
        `Horario: ${dados.horario}`,
        '',
        'Aguardo a confirmacao da disponibilidade.'
    ].join('\n');
}

function abrirWhatsApp(mensagem) {
    const numero = WHATSAPP_NUMBER.replace(/\D/g, '');
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

function mostrarStatus(mensagem, tipo) {
    statusMessage.textContent = mensagem;
    statusMessage.className = `mensagem-status ${tipo}`;
}

function lerAgendamentos() {
    try {
        return JSON.parse(localStorage.getItem(AGENDAMENTOS_STORAGE_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function salvarAgendamento(data, horario) {
    const agendamentos = lerAgendamentos();
    agendamentos.push({ data, horario });
    localStorage.setItem(AGENDAMENTOS_STORAGE_KEY, JSON.stringify(agendamentos));
}

function horarioJaAgendado(data, horario) {
    return lerAgendamentos().some(
        (agendamento) => agendamento.data === data && agendamento.horario === horario
    );
}

function ehDomingo(data) {
    return new Date(`${data}T12:00:00`).getDay() === 0;
}

function atualizarHorariosDisponiveis() {
    const data = dataInput.value;
    const horarios = horarioInput.querySelectorAll('option:not([value=""])');

    horarios.forEach((opcao) => {
        opcao.disabled = Boolean(data && (ehDomingo(data) || horarioJaAgendado(data, opcao.value)));
    });

    if (data && ehDomingo(data)) {
        horarioInput.value = '';
        mostrarStatus('O studio nao atende aos domingos. Escolha outra data.', 'erro');
    }
}

function validarDisponibilidade(data, horario) {
    if (ehDomingo(data)) {
        mostrarStatus('Os atendimentos aos domingos estao bloqueados.', 'erro');
        return false;
    }

    if (horarioJaAgendado(data, horario)) {
        mostrarStatus('Este horario ja foi agendado. Escolha outro horario.', 'erro');
        atualizarHorariosDisponiveis();
        return false;
    }

    return true;
}

function enviarAgendamento(event) {
    event.preventDefault();

    const dadosFormulario = new FormData(form);
    const dados = {
        nome: dadosFormulario.get('nome').trim(),
        atendimento: dadosFormulario.get('atendimento'),
        data: dadosFormulario.get('data'),
        horario: dadosFormulario.get('horario')
    };

    if (!form.checkValidity()) {
        form.reportValidity();
        mostrarStatus('Preencha todos os campos para continuar.', 'erro');
        return;
    }

    if (!validarDisponibilidade(dados.data, dados.horario)) {
        return;
    }

    const mensagem = criarMensagemAgendamento(dados);
    salvarAgendamento(dados.data, dados.horario);
    abrirWhatsApp(mensagem);
    mostrarStatus('Mensagem pronta no WhatsApp. Revise e toque em enviar.', 'sucesso');
}

dataInput.addEventListener('change', atualizarHorariosDisponiveis);
form.addEventListener('submit', enviarAgendamento);
