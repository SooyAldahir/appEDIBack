// validate(schema) -> middleware
module.exports = (schema) => (req, res, next) => {
  if (!schema || typeof schema.validate !== 'function') {
    return next(new Error('validate(): schema inválido'));
  }
  const src = req.method === 'GET' ? req.query
            : (req.method === 'DELETE' ? req.params : req.body);
  const { error, value } = schema.validate(src, {
    abortEarly: false, allowUnknown: true, stripUnknown: true,
  });
  if (error) return res.status(400).json({ error: error.message });
  if (req.method === 'GET') req.query = value;
  else if (req.method === 'DELETE') req.params = value;
  else req.body = value;
  next();
};
