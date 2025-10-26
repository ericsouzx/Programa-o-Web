const API_BASE_URL = 'https://proweb.leoproti.com.br/alunos'; 
/**
 * Exibe uma mensagem de status na UI.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo de alerta do Bootstrap (ex: 'success', 'danger', 'warning').
 */
function displayMessage(message, type = 'success') {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

/**
 * Limpa o formulário e reseta para o modo de Cadastro.
 */
function resetForm() {
    document.getElementById('alunoForm').reset();
    document.getElementById('alunoId').value = '';
    document.getElementById('form-title').textContent = 'Cadastrar Novo Aluno';
    document.getElementById('submitBtn').textContent = 'Salvar Aluno';
    document.getElementById('submitBtn').classList.remove('btn-warning');
    document.getElementById('submitBtn').classList.add('btn-success');
    document.getElementById('cancelBtn').style.display = 'none';
}

/**
 * Preenche o formulário para edição.
 * Esta função é chamada diretamente no HTML gerado pela renderAlunosTable.
 */
function editAluno(id, nome, turma, curso, matricula) {
    // Preenche os campos do formulário
    document.getElementById('alunoId').value = id;
    document.getElementById('nome').value = nome;
    document.getElementById('turma').value = turma;
    document.getElementById('curso').value = curso;
    document.getElementById('matricula').value = matricula;

    // Altera o título e o botão para o modo de edição
    document.getElementById('form-title').textContent = `Editar Aluno (ID: ${id})`;
    document.getElementById('submitBtn').textContent = 'Atualizar';
    document.getElementById('submitBtn').classList.remove('btn-success');
    document.getElementById('submitBtn').classList.add('btn-warning');
    document.getElementById('cancelBtn').style.display = 'inline-block';

    // Leva o usuário ao topo do formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Popula a tabela com os dados dos alunos.
 * @param {Array<Object>} alunos - Lista de objetos de aluno.
 */
function renderAlunosTable(alunos) {
    const tableBody = document.getElementById('alunosTableBody');
    tableBody.innerHTML = ''; // Limpa as linhas existentes

    if (!Array.isArray(alunos) || alunos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum aluno cadastrado.</td></tr>';
        return;
    }

    alunos.forEach(aluno => {
        const row = tableBody.insertRow();
        
        // Função para sanitizar strings e evitar quebra de aspas simples no onclick
        const sanitize = (str) => String(str).replace(/'/g, "\\'");

        row.innerHTML = `
            <td>${aluno.id}</td>
            <td>${aluno.nome}</td>
            <td>${aluno.turma}</td>
            <td>${aluno.curso}</td>
            <td>${aluno.matricula}</td>
            <td>
                <button class="btn btn-sm btn-warning me-2" 
                    onclick="editAluno(${aluno.id}, '${sanitize(aluno.nome)}', '${sanitize(aluno.turma)}', '${sanitize(aluno.curso)}', '${sanitize(aluno.matricula)}')">
                    Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteAluno(${aluno.id})">
                    Excluir
                </button>
            </td>
        `;
    });
}
/**
 * Função para realizar o GET (Listar) todos os alunos.
 */
async function fetchAlunos() {
    try {
        // GET /alunos
        const response = await fetch(API_BASE_URL);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const alunos = await response.json();
        renderAlunosTable(alunos);
    } catch (error) {
        console.error("Erro ao carregar alunos:", error);
        displayMessage(`Falha ao carregar a lista de alunos. Verifique a URL e o console.`, 'danger');
        document.getElementById('alunosTableBody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar os dados.</td></tr>';
    }
}

/**
 * Função para realizar o POST ou PUT (Criar ou Atualizar) um aluno.
 * @param {Object} alunoData - Os dados do aluno.
 * @param {number|string} [id=null] - O ID do aluno, se for uma atualização.
 */
async function saveAluno(alunoData, id = null) {
    const isUpdate = id !== null && id !== '';
    const method = isUpdate ? 'PUT' : 'POST';
    // POST /alunos OU PUT /alunos/{id}
    const url = isUpdate ? `${API_BASE_URL}/${id}` : API_BASE_URL;
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(alunoData)
        });

        if (!response.ok) {
            let errorDetails = `Erro ${response.status} ao ${isUpdate ? 'atualizar' : 'criar'} aluno.`;
            try {
                // Tenta ler o corpo da resposta para mais detalhes
                const errorBody = await response.json();
                if (errorBody && errorBody.message) {
                    errorDetails += ` Detalhes: ${errorBody.message}`;
                }
            } catch (e) {
                // Se o corpo não for JSON, ignora e usa apenas o status
            }
            throw new Error(errorDetails);
        }
        
        displayMessage(`Aluno ${alunoData.nome} ${isUpdate ? 'atualizado' : 'cadastrado'} com sucesso!`);
        resetForm();
        fetchAlunos(); // Recarrega a lista
    } catch (error) {
        console.error(`Erro na operação de salvar aluno:`, error);
        displayMessage(`Falha na operação: ${error.message}`, 'danger');
    }
}

/**
 * Função para realizar o DELETE (Remover) um aluno.
 * @param {number} id -
 */
async function deleteAluno(id) {
    if (!confirm(`Tem certeza que deseja remover o aluno com ID ${id}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        displayMessage(`Aluno com ID ${id} removido com sucesso!`);
        fetchAlunos(); 
    } catch (error) {
        console.error("Erro ao deletar aluno:", error);
        displayMessage(`Falha ao deletar aluno com ID ${id}: ${error.message}`, 'danger');
    }
}

/**
 * Função responsável por lidar com a submissão do formulário.
 */
function handleFormSubmit(event) {
    event.preventDefault(); 

    // Coletar dados
    const id = document.getElementById('alunoId').value;
    const nome = document.getElementById('nome').value.trim();
    const turma = document.getElementById('turma').value.trim();
    const curso = document.getElementById('curso').value.trim();
    const matricula = document.getElementById('matricula').value.trim();

    // Verificação simples de campos vazios (além do 'required' do HTML)
    if (!nome || !turma || !curso || !matricula) {
        displayMessage('Todos os campos devem ser preenchidos.', 'warning');
        return;
    }

    // Montar o objeto de dados
    const alunoData = { nome, turma, curso, matricula };
    
    // Chamar a função de salvamento (criação ou atualização)
    saveAluno(alunoData, id);
}

// Configurar os Event Listeners principais quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // 1. Carregar a lista inicial de alunos
    fetchAlunos();

    // 2. Configurar o evento de submissão do formulário
    document.getElementById('alunoForm').addEventListener('submit', handleFormSubmit);

    // 3. Configurar o botão de cancelamento de edição
    document.getElementById('cancelBtn').addEventListener('click', resetForm);
});

// Tornar 'editAluno' e 'deleteAluno' acessíveis globalmente 
// para serem chamadas a partir dos botões criados dinamicamente na tabela.
window.editAluno = editAluno;
window.deleteAluno = deleteAluno;