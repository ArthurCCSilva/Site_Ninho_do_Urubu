// src/components/ProductModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';
import Select from 'react-select';
import ImageCropperModal from './ImageCropperModal'; // Importa o novo modal de corte

function ProductModal({ show, onHide, productToEdit, onSave }) {
  // Estado inicial completo, incluindo os novos campos
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
  const [imagemFile, setImagemFile] = useState(null); // Guarda o arquivo FINAL (já cortado)
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef();

  // Estados para o cropper (editor de imagem)
  const [imageToCrop, setImageToCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef(null);

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

  // Preenche o formulário (para edição) ou o limpa (para adição)
  useEffect(() => {
    if (show) {
      if (productToEdit) {
        setFormData({
          nome: productToEdit.nome || '',
          descricao: productToEdit.descricao || '',
          valor: productToEdit.valor || '',
          categoria_id: productToEdit.categoria_id || null,
          estoque: productToEdit.estoque || '',
          destaque: !!productToEdit.destaque,
          promocao: !!productToEdit.promocao,
        });
      } else {
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

  // Funções para lidar com mudanças nos campos do formulário
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCheckboxChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked });
  const handleCategoryChange = (selectedOption) => setFormData({ ...formData, categoria_id: selectedOption ? selectedOption.value : null });
  
  // Abre o editor de imagem quando um arquivo é selecionado
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Recebe a imagem cortada do editor
  const handleCropComplete = (croppedFile) => {
    setImagemFile(croppedFile);
    setShowCropper(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  // Envia o formulário para o backend
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
    <>
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
                <div className="mb-3"><label className="form-label">Nome</label><input type="text" name="nome" value={formData.nome} onChange={handleChange} className="form-control" required /></div>
                <div className="mb-3"><label className="form-label">Descrição</label><textarea rows="3" name="descricao" value={formData.descricao} onChange={handleChange} className="form-control" /></div>
                <div className="row">
                  <div className="col"><div className="mb-3"><label className="form-label">Valor</label><input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} className="form-control" required /></div></div>
                  <div className="col"><div className="mb-3"><label className="form-label">Estoque</label><input type="number" name="estoque" value={formData.estoque} onChange={handleChange} className="form-control" required /></div></div>
                </div>
                <div className="mb-3">
                  <label htmlFor="categoria_id" className="form-label">Categoria</label>
                  <Select id="categoria_id" name="categoria_id" options={categories} placeholder="Selecione..." value={categories.find(option => option.value === formData.categoria_id) || null} onChange={handleCategoryChange} isClearable noOptionsMessage={() => "Nenhuma categoria"} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Imagem do Produto (Opcional)</label>
                  <input type="file" ref={fileInputRef} name="imagem_produto" onChange={handleFileSelect} className="form-control" accept="image/*" />
                  {imagemFile && <img src={URL.createObjectURL(imagemFile)} alt="Preview da imagem cortada" width="100" className="mt-2 rounded" />}
                </div>
                <hr />
                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" role="switch" id="destaqueCheck" name="destaque" checked={formData.destaque} onChange={handleCheckboxChange} />
                  <label className="form-check-label" htmlFor="destaqueCheck">Marcar como Produto Destaque</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="promocaoCheck" name="promocao" checked={formData.promocao} onChange={handleCheckboxChange} />
                  <label className="form-check-label" htmlFor="promocaoCheck">Marcar como Produto em Promoção</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onHide} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ImageCropperModal 
        show={showCropper}
        onHide={() => setShowCropper(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}

export default ProductModal;