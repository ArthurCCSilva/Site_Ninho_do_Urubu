// src/components/ProductAdminList.jsx

// Este componente é "burro": ele não tem lógica própria, apenas exibe os dados
// e executa as funções que recebe do componente "pai" (o Dashboard).
function ProductAdminList({ products, onEdit, onDelete }) {
  return (
    // A classe "table-responsive" garante que a tabela não quebre o layout em telas pequenas
    <div className="table-responsive">
      <table className="table table-striped table-bordered table-hover">
        <thead>
          <tr>
            <th>#ID</th>
            <th>Imagem</th>
            <th>Nome</th>
            <th>Valor</th>
            <th>Estoque</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {/* Usamos .map() para criar uma linha <tr> para cada produto */}
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>
                <img 
                  src={product.imagem_produto_url ? `http://localhost:3001/uploads/${product.imagem_produto_url}` : 'https://placehold.co/60'} 
                  alt={product.nome}
                  className="img-thumbnail" // Classe do Bootstrap para uma borda sutil
                  width="60" 
                />
              </td>
              <td>{product.nome}</td>
              <td>R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}</td>
              <td>{product.estoque}</td>
              <td>
                {/* Ao clicar, chama a função onEdit que veio do pai, passando o produto atual */}
                <button className="btn btn-warning btn-sm me-2" onClick={() => onEdit(product)}>
                  Editar
                </button>
                {/* Ao clicar, chama a função onDelete que veio do pai, passando o ID do produto */}
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