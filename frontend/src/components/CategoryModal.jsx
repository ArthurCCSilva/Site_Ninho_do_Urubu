// src/components/CategoryModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';

function CategoryModal({ show, onHide }) {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef();

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categorias');
      setCategories(response.data);
    } catch (err) {
      console.error("Falha ao buscar categorias", err);
      setError("Não foi possível carregar as categorias.");
    }
  };

  // Busca as categorias sempre que o modal é aberto
  useEffect(() => {
    if (show) {
      fetchCategories();
    }
  }, [show]);

  // Controla a exibição do modal
  useEffect(() => {
    const modalElement = modalRef.current;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError('');
    if (!newCategoryName.trim()) {
      setError("O nome da categoria não pode ser vazio.");
      return;
    }
    try {
      await api.post('/api/categorias', { nome: newCategoryName });
      setNewCategoryName(''); // Limpa o campo
      fetchCategories(); // Atualiza a lista
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao adicionar categoria.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await api.delete(`/api/categorias/${categoryId}`);
        fetchCategories(); // Atualiza a lista
      } catch (err) {
        alert(err.response?.data?.message || "Erro ao excluir categoria.");
      }
    }
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Gerenciar Categorias</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

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
            <ul className="list-group">
              {categories.map(cat => (
                <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {cat.nome}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(cat.id)}>Excluir</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryModal;