exports.Q = {
  create: `
    INSERT INTO EDI.Provisiones_Alimento (id_familia, fecha, cantidad_cenas, comentario)
    OUTPUT INSERTED.* VALUES (@id_familia, @fecha, @cantidad_cenas, @comentario)
  `,
  listByFamilia: `
    SELECT * FROM EDI.Provisiones_Alimento
    WHERE id_familia = @id_familia AND (@desde IS NULL OR fecha >= @desde) AND (@hasta IS NULL OR fecha <= @hasta) AND activo = 1
    ORDER BY fecha DESC, id_provision DESC
  `
};
