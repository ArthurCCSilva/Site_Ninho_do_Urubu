// src/components/ProductModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';
import Select from 'react-select';

function ProductModal({ show, onHide, productToEdit, onSave }) {
  // Estado inicial do formulário, agora com os novos campos
  const initialState = {
    nome: '',
    descricao: '',
    valor: '',
    categoria_id: null,
    estoque: '',
    destaque: false,
    promocao: false,
  };
  
  const [formData, setFormData] = useState(initialState);
  const [imagemFile, setImagemFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef();

  // Busca as categorias para o dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categorias?limit=all');
        const formattedCategories = response.data.categorias.map(cat => ({
          value: cat.id,
          label: cat.nome
        }));
        setCategories(formattedCategories);
      } catch (err) {
        console.error("Falha ao buscar categorias", err);
      }
    };
    if (show) {
      fetchCategories();
    }
  }, [show]);

  // Preenche ou limpa o formulário quando o modal é aberto
  useEffect(() => {
    if (show) {
      if (productToEdit) {
        // MODO EDIÇÃO: Preenche o formulário
        setFormData({
          nome: productToEdit.nome || '',
          descricao: productToEdit.descricao || '',
          valor: productToEdit.valor || '',
          categoria_id: productToEdit.categoria_id || null,
          estoque: productToEdit.estoque || '',
          destaque: !!productToEdit.destaque, // Converte 0/1 para false/true
          promocao: !!productToEdit.promocao, // Converte 0/1 para false/true
        });
      } else {
        // MODO ADIÇÃO: Limpa completamente o formulário
        setFormData(initialState);
      }
      setImagemFile(null);
      setError('');
    }
  }, [productToEdit, show]);
  
  // Controla a exibição do modal do Bootstrap
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  // Handlers para os inputs
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  // Handler específico para checkboxes
  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleCategoryChange = (selectedOption) => {
    setFormData({ ...formData, categoria_id: selectedOption ? selectedOption.value : null });
  };
  
  const handleFileChange = (e) => setImagemFile(e.target.files[0]);

  // Handler para a submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (imagemFile) {
      data.append('imagem_produto', imagemFile);
    }
    try {
      if (productToEdit) {
        await api.put(`/api/produtos/${productToEdit.id}`, data);
      } else {
        await api.post('/api/produtos', data);
      }
      onSave();
    } catch (error) {
      setError(error.response?.data?.message || "Erro ao salvar produto!");
      console.error("Falha ao salvar produto", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{productToEdit ? 'Editar Produto' : 'Adicionar Novo Produto'}</h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <div className="mb-3">
                <label className="form-label">Nome</label>
                <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="form-control" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Descrição</label>
                <textarea rows="3" name="descricao" value={formData.descricao} onChange={handleChange} className="form-control" />
              </div>
              <div className="row">
                <div className="col">
                  <div className="mb-3"><label className="form-label">Valor</label><input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} className="form-control" required /></div>
                </div>
                <div className="col">
                  <div className="mb-3"><label className="form-label">Estoque</label><input type="number" name="estoque" value={formData.estoque} onChange={handleChange} className="form-control" required /></div>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="categoria_id" className="form-label">Categoria</label>
                <Select
                  id="categoria_id"
                  name="categoria_id"
                  options={categories}
                  placeholder="Selecione ou digite para pesquisar..."
                  value={categories.find(option => option.value === formData.categoria_id) || null}
                  onChange={handleCategoryChange}
                  isClearable
                  noOptionsMessage={() => "Nenhuma categoria encontrada"}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Imagem do Produto (Opcional)</label>
                <input type="file" name="imagem_produto" onChange={handleFileChange} className="form-control" />
              </div>
              
              {/* --- NOVOS CAMPOS (DESTAQUE E PROMOÇÃO) --- */}
              <hr />
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  role="switch" 
                  id="destaqueCheck"
                  name="destaque"
                  checked={formData.destaque}
                  onChange={handleCheckboxChange}
                />
                <label className="form-check-label" htmlFor="destaqueCheck">Marcar como Produto Destaque</label>
              </div>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  role="switch" 
                  id="promocaoCheck"
                  name="promocao"
                  checked={formData.promocao}
                  onChange={handleCheckboxChange}
                />
                <label className="form-check-label" htmlFor="promocaoCheck">Marcar como Produto em Promoção</label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide} disabled={loading}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;