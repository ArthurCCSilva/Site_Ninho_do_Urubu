// src/pages/FuncionarioDashboard.jsx
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import EditProfileModal from '../components/EditProfileModal';
import { useState } from 'react';

function FuncionarioDashboard() {
    const { user } = useAuth();
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const profileImageUrl = user?.imagem_perfil_url ? `http://localhost:3001/uploads/${user.imagem_perfil_url}` : 'https://placehold.co/150';

    return (
        <div>
            <h1 className="mb-4">Painel do Funcionário</h1>
            <div className="row">
                <div className="col-lg-7 mb-4">
                    <div className="card h-100">
                        <div className="card-header"><h4>Suas Informações</h4></div>
                        <div className="card-body d-flex align-items-center">
                            <img src={profileImageUrl} alt="Foto" className="rounded-circle me-4" style={{width: 100, height: 100, objectFit: 'cover'}}/>
                            <div>
                                <h5>{user?.nome}</h5>
                                <p className="text-muted mb-0">{user?.email}</p>
                                <button className="btn btn-sm btn-outline-secondary mt-2" onClick={() => setShowEditProfileModal(true)}>Editar Perfil</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-5 mb-4">
                    <div className="card h-100">
                        <div className="card-header"><h4>Suas Permissões</h4></div>
                        <div className="card-body d-grid gap-2">
                            {user?.permissoes?.includes('acessar_comandas') && <Link to="/admin/comandas" className="btn btn-primary">Gerenciar Comandas</Link>}
                            {user?.permissoes?.includes('acessar_pedidos') && <Link to="/admin/pedidos" className="btn btn-secondary">Gerenciar Pedidos</Link>}
                            {user?.permissoes?.includes('acessar_painel_financeiro') && <Link to="/admin/financeiro" className="btn btn-warning">Painel Financeiro</Link>}
                            {user?.permissoes?.includes('acessar_info_clientes') && <Link to="/admin/clientes" className="btn btn-info">Info Clientes</Link>}
                            {user?.permissoes?.length === 0 && <p className="text-muted">Você não tem permissões especiais.</p>}
                        </div>
                    </div>
                </div>
            </div>
            <EditProfileModal show={showEditProfileModal} onHide={() => setShowEditProfileModal(false)} />
        </div>
    );
}

export default FuncionarioDashboard;