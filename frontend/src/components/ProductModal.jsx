// src/components/ProductModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';

function ProductModal({ show, onHide, productToEdit, onSave }) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor: '',
    categoria_id: '',
    estoque: '',
  });
  const [imagemFile, setImagemFile] = useState(null);
  const [categories, setCategories] = useState([]); // NOVO ESTADO: para guardar a lista de categorias
  const modalRef = useRef();

  // Busca as categorias para popular o dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categorias');
        setCategories(response.data);
      } catch (err) {
        console.error("Falha ao buscar categorias para o modal", err);
      }
    };
    if (show) { // Só busca quando o modal for aberto
      fetchCategories();
    }
  }, [show]);

  // Preenche o formulário ao editar
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        nome: productToEdit.nome || '',
        descricao: productToEdit.descricao || '',
        valor: productToEdit.valor || '',
        categoria_id: productToEdit.categoria_id || '',
        estoque: productToEdit.estoque || '',
      });
    } else {
      setFormData({ nome: '', descricao: '', valor: '', categoria_id: '', estoque: '' });
    }
    setImagemFile(null);
  }, [productToEdit, show]);

  // Controla a exibição do modal
  useEffect(() => {
    const modalElement = modalRef.current;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) {
      bsModal.show();
    } else {
      bsModal.hide();
    }
  }, [show]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setImagemFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (imagemFile) data.append('imagem_produto', imagemFile);

    try {
      if (productToEdit) {
        await api.put(`/api/produtos/${productToEdit.id}`, data);
      } else {
        await api.post('/api/produtos', data);
      }
      onSave();
    } catch (error) {
      console.error("Falha ao salvar produto", error);
      alert("Erro ao salvar produto!");
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
              {/* Nome */}
              <div className="mb-3">
                <label htmlFor="nome" className="form-label">Nome</label>
                <input type="text" id="nome" name="nome" value={formData.nome || ''} onChange={handleChange} className="form-control" required />
              </div>
              {/* Descrição */}
              <div className="mb-3">
                <label htmlFor="descricao" className="form-label">Descrição</label>
                <textarea id="descricao" name="descricao" rows="3" value={formData.descricao || ''} onChange={handleChange} className="form-control" />
              </div>
              {/* Valor e Estoque na mesma linha */}
              <div className="row">
                <div className="col">
                  <div className="mb-3">
                    <label htmlFor="valor" className="form-label">Valor</label>
                    <input type="number" id="valor" name="valor" step="0.01" value={formData.valor || ''} onChange={handleChange} className="form-control" required />
                  </div>
                </div>
                <div className="col">
                  <div className="mb-3">
                    <label htmlFor="estoque" className="form-label">Estoque</label>
                    <input type="number" id="estoque" name="estoque" value={formData.estoque || ''} onChange={handleChange} className="form-control" required />
                  </div>
                </div>
              </div>

              {/* --- CAMPO DE CATEGORIA ATUALIZADO (DE INPUT PARA SELECT) --- */}
              <div className="mb-3">
                <label htmlFor="categoria_id" className="form-label">Categoria</label>
                <select 
                  id="categoria_id"
                  name="categoria_id" // O 'name' agora é 'categoria_id'
                  value={formData.categoria_id || ''}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {/* Mapeia a lista de categorias buscadas da API para criar as opções */}
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>
              {/* --- FIM DA ATUALIZAÇÃO DO CAMPO DE CATEGORIA --- */}

              {/* Imagem */}
              <div className="mb-3">
                <label htmlFor="imagem_produto" className="form-label">Imagem do Produto (se quiser adicionar/alterar)</label>
                <input type="file" id="imagem_produto" name="imagem_produto" onChange={handleFileChange} className="form-control" />
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;