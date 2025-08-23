// src/components/ProductModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';
import Select from 'react-select'; // Importa o novo componente Select

function ProductModal({ show, onHide, productToEdit, onSave }) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor: '',
    categoria_id: '',
    estoque: '',
  });
  const [imagemFile, setImagemFile] = useState(null);
  
  // Este estado guardará as categorias no formato { value, label } exigido pelo React Select
  const [categories, setCategories] = useState([]);
  const modalRef = useRef();

  // Busca as categorias e as formata para o React Select
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
        console.error("Falha ao buscar categorias para o modal de produto", err);
      }
    };
    if (show) {
      fetchCategories();
    }
  }, [show]);

  // Preenche o formulário ao editar (sem alterações na lógica)
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
  
  // Controla a exibição do modal (sem alterações na lógica)
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  // Handlers para os inputs normais e de arquivo
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setImagemFile(e.target.files[0]);

  // ✅ NOVA FUNÇÃO: Handler específico para a mudança no componente React Select
  const handleCategoryChange = (selectedOption) => {
    setFormData({ ...formData, categoria_id: selectedOption ? selectedOption.value : '' });
  };

  // Envia o formulário para o backend (sem alterações na lógica)
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
              
              {/* ✅ MUDANÇA PRINCIPAL: O <select> HTML foi substituído pelo componente <Select> */}
              <div className="mb-3">
                <label htmlFor="categoria_id" className="form-label">Categoria</label>
                <Select
                  id="categoria_id"
                  name="categoria_id"
                  options={categories}
                  placeholder="Selecione ou digite para pesquisar..."
                  value={categories.find(option => option.value === formData.categoria_id)}
                  onChange={handleCategoryChange}
                  isClearable
                  noOptionsMessage={() => "Nenhuma categoria encontrada"}
                />
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