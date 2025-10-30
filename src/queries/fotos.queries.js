exports.Q = {
  add: `
    INSERT INTO dbo.Fotos_Publicacion (id_post, url_foto)
    OUTPUT INSERTED.* VALUES (@id_post, @url_foto)
  `,
  listByPost: `SELECT * FROM dbo.Fotos_Publicacion WHERE id_post = @id_post ORDER BY id_foto ASC`
};
