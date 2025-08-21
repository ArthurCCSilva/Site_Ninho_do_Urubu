// src/components/ProductModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap'; // Importamos o Modal do JavaScript do Bootstrap

function ProductModal({ show, onHide, productToEdit, onSave }) {
  const [formData, setFormData] = useState({});
  const [imagemFile, setImagemFile] = useState(null);
  const modalRef = useRef(); // useRef cria um "link" direto para um elemento HTML

  // Este useEffect preenche o formulário quando clicamos em "Editar"
  useEffect(() => {
    if (productToEdit) {
      setFormData(productToEdit);
    } else {
      setFormData({ nome: '', descricao: '', valor: '', categoria: '', estoque: '' });
    }
  }, [productToEdit, show]);

  // Este useEffect controla o abre/fecha do modal
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
      onSave(); // Avisa o Dashboard que a operação foi um sucesso
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
              {/* ... campos do formulário ... */}
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