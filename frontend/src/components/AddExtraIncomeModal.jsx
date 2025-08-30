// src/components/AddExtraIncomeModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import CurrencyInput from 'react-currency-input-field';

function AddExtraIncomeModal({ show, onHide, onSave }) {
  const initialState = { descricao: '', valor: '', data: new Date() };
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const modalRef = useRef();

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) {
      setFormData(initialState);
      setError('');
      bsModal.show();
    } else {
      bsModal.hide();
    }
  }, [show]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCurrencyChange = (value, name) => {
    setFormData(prev => ({ ...prev, [name]: value === undefined ? '' : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const dataFormatada = formData.data.toISOString().split('T')[0];
      // O formData.valor já está no formato correto ("12.34"), não precisa de replace
      await api.post('/api/rendas-extras', { ...formData, data: dataFormatada });
      alert('Renda extra adicionada com sucesso!');
      onSave();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao adicionar renda extra.');
    }
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Adicionar Renda Extra</h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="mb-3"><label htmlFor="income-descricao" className="form-label">Descrição</label><input type="text" className="form-control" id="income-descricao" name="descricao" value={formData.descricao} onChange={handleChange} required /></div>
              <div className="mb-3">
                <label htmlFor="income-valor" className="form-label">Valor (R$)</label>
                <CurrencyInput
                  id="income-valor"
                  name="valor"
                  className="form-control"
                  value={formData.valor}
                  onValueChange={handleCurrencyChange}
                  intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                  decimalScale={2}
                  placeholder="R$ 0,00"
                  required
                />
              </div>
              <div className="mb-3"><label className="form-label d-block">Data da Renda</label><DatePicker selected={formData.data} onChange={(date) => setFormData({...formData, data: date})} className="form-control" dateFormat="dd/MM/yyyy" locale="pt-BR" /></div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar Renda</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddExtraIncomeModal;