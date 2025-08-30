// src/components/ProductAdminList.jsx

function ProductAdminList({ products, onEdit, onDelete, onReactivate }) {
  const getStockBadgeClass = (stock) => {
    if (stock <= 0) return 'bg-danger';
    if (stock <= 10) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th style={{ width: '10%' }}>Imagem</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Valor</th>
            <th>Estoque</th>
            <th>Status</th>
            <th className="text-end">Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} className={product.status === 'inativo' ? 'table-secondary text-muted' : ''}>
              <td>
                <img 
                  src={product.imagem_produto_url ? `http://localhost:3001/uploads/${product.imagem_produto_url}` : 'https://placehold.co/80'} 
                  alt={product.nome}
                  className="img-fluid rounded"
                  style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                />
              </td>
              <td>{product.nome}</td>
              <td>{product.categoria_nome || <span className="text-muted">N/A</span>}</td>
              <td>R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}</td>
              <td>
                <span className={`badge ${getStockBadgeClass(product.estoque_total)}`}>
                  {product.estoque_total}
                </span>
              </td>
              <td>
                <span className={`badge ${product.status === 'ativo' ? 'bg-success' : 'bg-danger'}`}>
                  {product.status}
                </span>
              </td>
              <td className="text-end">
                <button className="btn btn-warning btn-sm me-2" onClick={() => onEdit(product)}>
                  Editar
                </button>
                {product.status === 'ativo' ? (
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(product.id)}>
                    Desativar
                  </button>
                ) : (
                  <button className="btn btn-success btn-sm" onClick={() => onReactivate(product.id)}>
                    Reativar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductAdminList;