exports.Q = {
  add: `
    INSERT INTO dbo.Fotos_Publicacion (id_post, url_foto)
    OUTPUT INSERTED.* VALUES (@id_post, @url_foto)
  `,
  listByPost: `SELECT * FROM dbo.Fotos_Publicacion WHERE id_post = @id_post ORDER BY id_foto ASC`,

  getByFamilia: `
    SELECT 
      id_post, 
      url_imagen, 
      mensaje, 
      created_at
    FROM dbo.Publicaciones
    WHERE id_familia = @id_familia
      AND url_imagen IS NOT NULL 
      AND url_imagen != ''
      AND (estado = 'Publicado' OR estado = 'Aprobada')
      AND activo = 1
    ORDER BY created_at DESC
  `,
  create: `INSERT INTO ...` 
};
