// backend/controllers/boletoPlanosController.js
const db = require('../db');

exports.getPlanosPorProduto = async (req, res) => {
  try {
    const { produtoId } = req.params;
    const [planos] = await db.query('SELECT * FROM boleto_planos WHERE produto_id = ? ORDER BY numero_parcelas ASC', [produtoId]);
    res.status(200).json(planos);
  } catch (error) { res.status(500).json({ message: 'Erro ao buscar planos.' }); }
};

exports.adicionarPlano = async (req, res) => {
  try {
    const { produto_id, numero_parcelas, valor_parcela, juros } = req.body;
    await db.query(
      'INSERT INTO boleto_planos (produto_id, numero_parcelas, valor_parcela, juros) VALUES (?, ?, ?, ?)',
      [produto_id, numero_parcelas, valor_parcela, juros || false]
    );
    res.status(201).json({ message: 'Plano adicionado com sucesso!' });
  } catch (error) { res.status(500).json({ message: 'Erro ao adicionar plano.' }); }
};

exports.deletarPlano = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM boleto_planos WHERE id = ?', [id]);
    res.status(200).json({ message: 'Plano deletado com sucesso.' });
  } catch (error) { res.status(500).json({ message: 'Erro ao deletar plano.' }); }
};