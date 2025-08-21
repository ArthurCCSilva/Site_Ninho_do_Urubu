// src/components/ProductCard.jsx
function ProductCard({ product }) { // '{ product }' é como recebemos os dados do produto
  const imageUrl = product.imagem_produto_url
    ? `http://localhost:3001/uploads/${product.imagem_produto_url}`
    : 'https://placehold.co/300x200'; // Imagem padrão caso não haja

  return (
    <div className="card h-100">
      <img src={imageUrl} className="card-img-top" alt={product.nome} style={{ height: '200px', objectFit: 'cover' }} />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{product.nome}</h5>
        <p className="card-text flex-grow-1">
          {product.descricao ? `${product.descricao.substring(0, 80)}...` : 'Sem descrição.'}
        </p>
        <div>
          <p className="card-text fw-bold fs-5">
            R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}
          </p>
          <a href="#" className="btn btn-primary w-100">Adicionar ao Carrinho</a>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;