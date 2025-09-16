// src/pages/FuncionarioDashboard.jsx
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import EditProfileModal from '../components/EditProfileModal';
import { useState } from 'react';
import { useFeatureFlags } from '../context/FeatureFlagContext';

function FuncionarioDashboard() {
    const { user } = useAuth();
    const { isEnabled } = useFeatureFlags();
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    
    const profileImageUrl = user?.imagem_perfil_url ? `http://localhost:3001/uploads/${user.imagem_perfil_url}` : 'https://placehold.co/150';

    // Verificamos se o funcionário tem QUALQUER permissão para decidir se mostramos a mensagem de 'sem permissões'.
    const hasAnyPermission = user?.permissoes && user.permissoes.length > 0;

    return (
        <div>
            <h1 className="mb-4">Painel do Funcionário</h1>
            <div className="row">
                <div className="col-lg-7 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h4>Suas Informações ({user?.funcaoNome || 'Funcionário'})</h4>
                        </div>
                        <div className="card-body d-flex align-items-center">
                            <img src={profileImageUrl} alt="Foto" className="rounded-circle me-4" style={{width: 100, height: 100, objectFit: 'cover'}}/>
                            <div>
                                <h5>{user?.nomeCompleto}</h5>
                                <p className="text-muted mb-0">{user?.usuario}</p>
                                <button className="btn btn-sm btn-outline-secondary mt-2" onClick={() => setShowEditProfileModal(true)}>Editar Perfil</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-5 mb-4">
                    <div className="card h-100">
                        <div className="card-header"><h4>Suas Ações</h4></div>
                        <div className="card-body d-grid gap-2">
                            
                            {/* --- LISTA COMPLETA DE AÇÕES, IGUAL AO ADMIN, MAS COM VERIFICAÇÃO DUPLA --- */}

                            {isEnabled('admin_gerenciar_pedidos') && user?.permissoes?.includes('admin_gerenciar_pedidos') && 
                                <Link to="/admin/pedidos" className="btn btn-primary">Gerenciar Pedidos</Link>}
                                
                            {isEnabled('admin_registrar_venda_fisica') && user?.permissoes?.includes('admin_registrar_venda_fisica') && 
                                <Link to="/admin/venda-fisica" className="btn btn-success">Registrar Venda Física</Link>}

                            {isEnabled('admin_gerenciar_comandas') && user?.permissoes?.includes('admin_gerenciar_comandas') && 
                                <Link to="/admin/comandas" className="btn btn-info">Gerenciar Comandas</Link>}
                                
                            {isEnabled('admin_painel_financeiro') && user?.permissoes?.includes('admin_painel_financeiro') && 
                                <Link to="/admin/financeiro" className="btn btn-warning">Painel Financeiro</Link>}
                                
                            {isEnabled('sistema_boleto') && user?.permissoes?.includes('sistema_boleto') && 
                                <Link to="/admin/boletos" className="btn btn-dark">Gerenciar Boletos</Link>}

                            {isEnabled('admin_info_clientes') && user?.permissoes?.includes('admin_info_clientes') && 
                                <Link to="/admin/clientes" className="btn btn-secondary">Info Clientes</Link>}
                            
                            {/* A permissão para 'Gerenciar Funcionários' geralmente é só do admin, mas incluímos a lógica caso você queira delegar */}
                            {isEnabled('admin_gerenciar_funcionarios') && user?.permissoes?.includes('admin_gerenciar_funcionarios') && 
                                <Link to="/admin/funcionarios" className="btn btn-primary">Gerenciar Funcionários</Link>}
                                
                            {isEnabled('admin_gerenciar_categorias') && user?.permissoes?.includes('admin_gerenciar_categorias') && 
                                <Link to="/admin/categorias" className="btn btn-info">Gerenciar Categorias</Link>}
                                
                            {isEnabled('admin_reativar_produtos') && user?.permissoes?.includes('admin_reativar_produtos') && 
                                <Link to="/admin/produtos/reativar" className="btn btn-outline-success">Reativar Produtos</Link>}
                                
                            {isEnabled('admin_editar_cliente') && user?.permissoes?.includes('admin_editar_cliente') && 
                                <Link to="/admin/clientes/editar" className="btn btn-outline-info">Editar Cliente</Link>}

                            {!hasAnyPermission && 
                                <p className="text-muted text-center mt-3">Você não tem ações disponíveis no momento.</p>}
                        </div>
                    </div>
                </div>
            </div>
            <EditProfileModal show={showEditProfileModal} onHide={() => setShowEditProfileModal(false)} />
        </div>
    );
}

export default FuncionarioDashboard;