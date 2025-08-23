// src/components/CategoryModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';
import Pagination from './Pagination';

function CategoryModal({ show, onHide, onUpdate }) {
  // --- Estados do Componente ---
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef();

  // Estados para pesquisa, edição e paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // --- Funções de Lógica ---

  // Função para buscar as categorias de forma paginada
  const fetchCategories = async (page = 1) => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('page', page);
      params.append('limit', 10); // Limite de 10 por página

      const response = await api.get(`/api/categorias?${params.toString()}`);
      
      setCategories(response.data.categorias);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);

    } catch (err) {
      console.error("Falha ao buscar categorias", err);
      setError("Não foi possível carregar as categorias.");
    }
  };

  // useEffect para buscar quando o modal abre ou a busca muda
  useEffect(() => {
    if (show) {
      const debounceFetch = setTimeout(() => {
        fetchCategories(1); // Sempre volta para a página 1 ao fazer uma nova busca
      }, 300);
      return () => clearTimeout(debounceFetch);
    }
  }, [show, searchTerm]);

  // useEffect para controlar a exibição (abrir/fechar) do modal
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);

    if (show) {
      bsModal.show();
    } else {
      bsModal.hide();
    }
  }, [show]);

  // --- Funções de Manipulação (Handlers) ---

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError('');
    if (!newCategoryName.trim()) {
      setError("O nome da categoria не pode estar vazio.");
      return;
    }
    try {
      await api.post('/api/categorias', { nome: newCategoryName });
      setNewCategoryName('');
      fetchCategories(currentPage); // Atualiza a lista na página atual
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao adicionar categoria.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Tem certeza? Se esta categoria estiver em uso, não será possível excluí-la.')) {
      try {
        await api.delete(`/api/categorias/${categoryId}`);
        fetchCategories(currentPage); // Atualiza a lista
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.response?.data?.message || "Erro ao excluir categoria.");
      }
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory.nome.trim()) {
      alert("O nome da categoria não pode estar vazio.");
      return;
    }
    try {
      await api.put(`/api/categorias/${editingCategory.id}`, { nome: editingCategory.nome });
      setEditingCategory(null);
      fetchCategories(currentPage);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao atualizar categoria.");
    }
  };

  // --- Renderização do Componente (JSX) ---

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Gerenciar Categorias</h5>
            <button type="button" className="btn-close" onClick={() => { setEditingCategory(null); onHide(); }}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            
            <div className="mb-4">
              <input 
                type="text"
                className="form-control"
                placeholder="Pesquisar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <h6 className="mb-3">Adicionar Nova Categoria</h6>
            <form onSubmit={handleAddCategory} className="d-flex mb-4">
              <input 
                type="text" 
                className="form-control me-2"
                placeholder="Nome da nova categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Adicionar</button>
            </form>

            <hr />
            <h6 className="mb-3">Categorias Existentes</h6>
            <ul className="list-group mb-4">
              {categories.length > 0 ? categories.map(cat => (
                <li key={cat.id} className="list-group-item">
                  {editingCategory?.id === cat.id ? (
                    // MODO DE EDIÇÃO
                    <form onSubmit={handleUpdateCategory} className="d-flex align-items-center">
                      <input 
                        type="text"
                        className="form-control me-2"
                        value={editingCategory.nome}
                        onChange={(e) => setEditingCategory({ ...editingCategory, nome: e.target.value })}
                        autoFocus
                      />
                      <button type="submit" className="btn btn-success btn-sm me-2">Salvar</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingCategory(null)}>Cancelar</button>
                    </form>
                  ) : (
                    // MODO DE VISUALIZAÇÃO
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{cat.nome}</span>
                      <div>
                        <button className="btn btn-warning btn-sm me-2" onClick={() => setEditingCategory(cat)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(cat.id)}>Excluir</button>
                      </div>
                    </div>
                  )}
                </li>
              )) : (
                 <li className="list-group-item text-muted">Nenhuma categoria encontrada.</li>
              )}
            </ul>

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => fetchCategories(page)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryModal;