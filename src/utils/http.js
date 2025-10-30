exports.ok = (res, data) => res.status(200).json(data);
exports.created = (res, data) => res.status(201).json(data);
exports.bad = (res, msg='Datos inválidos') => res.status(400).json({ error: msg });
exports.notFound = (res, msg='No encontrado') => res.status(404).json({ error: msg });
exports.fail = (res, err) => {
  console.error('❌', err);
  res.status(500).json({ error: 'Error interno' });
};
