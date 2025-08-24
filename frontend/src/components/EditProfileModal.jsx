// src/components/EditProfileModal.jsx
import { useEffect, useRef, useState } from 'react';
import { Modal } from 'bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UpdateField from './UpdateField';
import UpdatePasswordForm from './UpdatePasswordForm';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

function EditProfileModal({ show, onHide }) {
  const { user, logout } = useAuth();
  const modalRef = useRef();
  const [telefone, setTelefone] = useState('');
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    if (user && show) {
      setTelefone(user.telefone || '');
    }
  }, [user, show]);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  // ✅ ESTA É A FUNÇÃO CENTRALIZADA QUE RESOLVE O BUG
  // Ela fecha o modal, espera a animação e SÓ DEPOIS faz o logout.
  const handleSuccess = (message = 'Perfil atualizado') => {
    onHide(); // 1. Manda o modal se fechar
    setTimeout(() => { // 2. Espera 500ms
      alert(`${message}! Será necessário fazer o login novamente.`);
      logout(); // 3. Desloga o usuário com a tela já limpa
    }, 500);
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('imagem_perfil', file);
    setLoadingImage(true);
    try {
      await api.put('/api/usuarios/perfil', data);
      handleSuccess('Foto atualizada'); // Usa a função central de sucesso
    } catch (error) {
      alert('Erro ao atualizar a foto.');
    } finally {
      setLoadingImage(false);
    }
  };

  const handlePhoneSave = async () => {
    if (telefone === user.telefone) return; // Não salva se não houver mudança
    setLoadingPhone(true);
    try {
      const formData = new FormData();
      formData.append('telefone', telefone);
      await api.put('/api/usuarios/perfil', formData);
      handleSuccess('Telefone atualizado'); // Usa a função central de sucesso
    } catch(err) {
      alert("Falha ao atualizar telefone.");
    } finally {
      setLoadingPhone(false);
    }
  };

  const profileImageUrl = user?.imagem_perfil_url ? `http://localhost:3001/uploads/${user.imagem_perfil_url}` : 'https://placehold.co/200';

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Editar Perfil</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="row g-4">
              <div className="col-md-4 text-center">
                <img src={profileImageUrl} alt="Foto de Perfil" className="img-fluid rounded-circle mb-3" style={{width: '150px', height: '150px', objectFit: 'cover'}}/>
                <h5 className="card-title">{user?.nome}</h5>
                <label htmlFor="modalProfileImageInput" className={`btn btn-outline-primary btn-sm ${loadingImage ? 'disabled' : ''}`}>
                  {loadingImage ? 'Enviando...' : 'Trocar Foto'}
                </label>
                <input type="file" id="modalProfileImageInput" style={{ display: 'none' }} onChange={handleProfileImageChange} disabled={loadingImage} />
              </div>
              <div className="col-md-8">
                {/* ✅ Passamos a função onSuccess para os mini-formulários */}
                <UpdateField fieldName="nome" label="Nome Completo" initialValue={user?.nome || ''} onSuccess={handleSuccess} />
                <UpdateField fieldName="email" label="Email" initialValue={user?.email || ''} inputType="email" onSuccess={handleSuccess} />
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="card-title">WhatsApp</h6>
                    <div className="d-flex">
                      <PhoneInput value={telefone} onChange={setTelefone} defaultCountry="BR" className="form-control me-2" />
                      <button className="btn btn-success" onClick={handlePhoneSave} disabled={loadingPhone}>
                        {loadingPhone ? '...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </div>
                <UpdatePasswordForm onSuccess={handleSuccess} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default EditProfileModal;