// src/components/ProductAdminList.jsx

function ProductAdminList({ products, onEdit, onDelete }) {
  // Função auxiliar para dar cor ao estoque
  const getStockBadgeClass = (stock) => {
    if (stock <= 0) return 'bg-danger';   // Esgotado
    if (stock <= 10) return 'bg-warning'; // Estoque baixo
    return 'bg-success';                   // Estoque saudável
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
            <th>Estoque</th> {/* ✅ 1. ADICIONA o cabeçalho da coluna */}
            <th className="text-end">Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
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
              
              {/* ✅ 2. ADICIONA a célula que exibe o estoque */}
              <td>
                <span className={`badge ${getStockBadgeClass(product.estoque_total)}`}>
                  {product.estoque_total}
                </span>
              </td>

              <td className="text-end">
                <button className="btn btn-warning btn-sm me-2" onClick={() => onEdit(product)}>
                  Editar
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(product.id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductAdminList;