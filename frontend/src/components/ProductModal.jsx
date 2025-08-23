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
  
  // ✅ ADICIONADO: Lógica para buscar as categorias DENTRO do modal
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categorias');
        setCategories(response.data.categorias || []);
      } catch (err) {
        console.error("Falha ao buscar categorias para o modal de produto", err);
      }
    };
    if (show) {
      fetchCategories();
    }
  }, [show]);

  const modalRef = useRef();

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
  
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
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
              <div className="mb-3"><label className="form-label">Nome</label><input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} className="form-control" required /></div>
              <div className="mb-3"><label className="form-label">Descrição</label><textarea rows="3" name="descricao" value={formData.descricao || ''} onChange={handleChange} className="form-control" /></div>
              <div className="row">
                <div className="col"><div className="mb-3"><label className="form-label">Valor</label><input type="number" step="0.01" name="valor" value={formData.valor || ''} onChange={handleChange} className="form-control" required /></div></div>
                <div className="col"><div className="mb-3"><label className="form-label">Estoque</label><input type="number" name="estoque" value={formData.estoque || ''} onChange={handleChange} className="form-control" required /></div></div>
              </div>
              <div className="mb-3">
                <label htmlFor="categoria_id" className="form-label">Categoria</label>
                <select id="categoria_id" name="categoria_id" value={formData.categoria_id || ''} onChange={handleChange} className="form-select" required >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3"><label className="form-label">Imagem</label><input type="file" name="imagem_produto" onChange={handleFileChange} className="form-control" /></div>
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