// src/components/BoletoDaysModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';

function BoletoDaysModal({ show, onHide }) {
  const [dias, setDias] = useState([]);
  const [novoDia, setNovoDia] = useState(10);
  const modalRef = useRef();

  const fetchDias = async () => {
    const response = await api.get('/api/boleto-dias');
    setDias(response.data);
  };

  useEffect(() => { if (show) fetchDias(); }, [show]);

  useEffect(() => {
    const modalElement = modalRef.current;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show(); else bsModal.hide();
  }, [show]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/boleto-dias', { dia: novoDia });
      fetchDias();
    } catch (err) { alert("Erro ao adicionar dia."); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza?')) {
      try {
        await api.delete(`/api/boleto-dias/${id}`);
        fetchDias();
      } catch (err) { alert("Erro ao deletar dia."); }
    }
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header"><h5 className="modal-title">Gerenciar Dias de Vencimento de Boletos</h5><button type="button" className="btn-close" onClick={onHide}></button></div>
          <div className="modal-body">
            <form onSubmit={handleAdd} className="d-flex mb-4">
              <input type="number" min="1" max="31" className="form-control me-2" value={novoDia} onChange={(e) => setNovoDia(e.target.value)} required/>
              <button type="submit" className="btn btn-primary">Adicionar</button>
            </form>
            <ul className="list-group">{dias.map(d => (
                <li key={d.id} className="list-group-item d-flex justify-content-between align-items-center">
                  Dia {d.dia_vencimento}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>Excluir</button>
                </li>
            ))}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}
export default BoletoDaysModal;