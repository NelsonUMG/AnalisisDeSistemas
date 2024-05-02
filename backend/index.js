const port = 4000;
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const oracledb = require('oracledb');
const bodyParser = require('body-parser');

app.use(express.json());
app.use(cors());


const dbConfig = {
  user: 'SYS',
  password: '123',
  connectString: 'localhost:1521/xe'
};

async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('Connected to Oracle Express');
  } catch (err) {
    console.error('Error connecting to Oracle Express:', err.message);
    process.exit(1);
  }
}

initialize();


const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});


const upload = multer({ storage: storage }).array('product', 3); // Cambiado a 'product' para que coincida con el nombre del campo esperado

app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: 0, message: 'Error al cargar imágenes' });
    }

    const imageUrls = req.files.map((file) => `http://localhost:4000/images/${file.filename}`);

    res.json({
      success: 1,
      image_urls: imageUrls,
    });
  });
});

app.use('/images', express.static('upload/images'));




app.get("/", (req, res) => {
  res.send("Root");
});

app.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Busca el usuario por correo electrónico
    const result = await connection.execute(
      `SELECT id, contraseña FROM USUARIO WHERE correo = :correo`,
      [correo]
    );

    if (result.rows.length === 0) {
      // Usuario no encontrado
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comprueba si la contraseña coincide
    const user = result.rows[0];
    if (contraseña !== user[1]) {
      // Contraseña incorrecta
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Genera un token de autenticación
    const token = jwt.sign({ userId: user[0] }, 'secret_key', { expiresIn: '1h' });

    // Responde con el token
    res.json({ token });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ error: 'Error en el inicio de sesión' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});



app.post('/signup', async (req, res) => {

});


    app.get("/allproducts", async (req, res) => {
      let connection;
    
      try {
        // Establece la conexión con la base de datos
        connection = await oracledb.getConnection(dbConfig);
    
        // Ejecuta la consulta para obtener todos los productos con el nombre de la categoría
        const result = await connection.execute(
          `SELECT p.id, p.nombre_producto, p.descripcion_producto, p.imagen_producto1, c.nombre_categoria
           FROM PRODUCTO p
           INNER JOIN CATEGORIA_PRODUCTO c ON p.id_categoria = c.id
           WHERE p.estado = 1`
        );
    
        // Envia los productos como respuesta
        res.json(result.rows.map(row => ({
          id: row[0],
          nombre_producto: row[1],
          descripcion_producto: row[2],
          imagen_producto1: row[3],
          nombre_categoria: row[4]
        })));
        
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener los productos" });
      } finally {
        // Cierra la conexión
        if (connection) {
          try {
            await connection.close();
          } catch (error) {
            console.error(error);
          }
        }
      }
    });
    


app.get("/newcollections", async (req, res) => {
	
});

app.get("/popularinwomen", async (req, res) => {

});

//
app.post('/addtocart', async (req, res) => {

  })


app.post('/removefromcart', async (req, res) => {

  })

app.post('/getcart', async (req, res) => {

  })

  app.post('/addproduct', async (req, res) => {
    const newProductData = {
        id_categoria: req.body.id_categoria,
        nombre_producto: req.body.nombre_producto,
        descripcion_producto: req.body.descripcion_producto,
        imagen_producto1: req.body.imagen_producto1,
        imagen_producto2: req.body.imagen_producto2,
        imagen_producto3: req.body.imagen_producto3,
        estado: req.body.estado,
    };

    // Verificar si el producto ya existe
    const queryCheckProduct = `SELECT id FROM PRODUCTO WHERE nombre_producto = :nombre_producto`;
    const bindsCheckProduct = { nombre_producto: newProductData.nombre_producto };

    oracledb.getConnection(async (err, connection) => {
        try {
            let resultCheckProduct = await connection.execute(queryCheckProduct, bindsCheckProduct);
            if (resultCheckProduct.rows.length > 0) {
                // Si el producto ya existe, obtén su ID y continúa con el resto del código
                const existingProductId = resultCheckProduct.rows[0][0];
                await handleItemAndConfigInsertion(existingProductId, req, res, connection);
            } else {
                // Si el producto no existe, procede a insertarlo
                await insertNewProduct(newProductData, req, res, connection);
            }
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ success: false, error: "Error al verificar o insertar el producto en Oracle Express" });
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error(err.message);
                }
            }
        }
    });
});

async function insertNewProduct(newProductData, req, res, connection) {
    // Insertar en Oracle
    const queryProducto = `INSERT INTO PRODUCTO (id_categoria, nombre_producto, descripcion_producto, imagen_producto1, imagen_producto2, imagen_producto3, estado) 
                           VALUES (:id_categoria, :nombre_producto, :descripcion_producto, :imagen_producto1, :imagen_producto2, :imagen_producto3, :estado) 
                           RETURNING id INTO :id`;
    const bindsProducto = {
        id_categoria: newProductData.id_categoria,
        nombre_producto: newProductData.nombre_producto,
        descripcion_producto: newProductData.descripcion_producto,
        imagen_producto1: newProductData.imagen_producto1,
        imagen_producto2: newProductData.imagen_producto2,
        imagen_producto3: newProductData.imagen_producto3,
        estado: newProductData.estado,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    let result = await connection.execute(queryProducto, bindsProducto, { autoCommit: true });
    const newProductId = result.outBinds.id[0]; // Obtener el ID generado

    await handleItemAndConfigInsertion(newProductId, req, res, connection);
}

async function handleItemAndConfigInsertion(productId, req, res, connection) {
  // Insertar en ITEM_PRODUCTO
  const newItemData = {
      id_producto: productId,
      cantidad_disp: req.body.cantidad,
      precio: Number(parseFloat(req.body.precio).toFixed(2)),
      estado: req.body.estado,
  };

  const queryItem = `INSERT INTO ITEM_PRODUCTO (id_producto, cantidad_disp, precio, estado) 
                     VALUES (:id_producto, :cantidad_disp, :precio, :estado) 
                     RETURNING id INTO :id`;
  const bindsItem = {
      id_producto: newItemData.id_producto,
      cantidad_disp: newItemData.cantidad_disp,
      precio: newItemData.precio,
      estado: newItemData.estado,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
  };

  let itemId;
  let result = await connection.execute(queryItem, bindsItem, { autoCommit: true });
  itemId = result.outBinds.id[0];

  // Verificar si id_opcion_variacion_1 tiene valor
  if (req.body.id_opcion_variacion_1 && req.body.id_opcion_variacion_1 !== "") {
      // Insertar dos veces en CONFIGURACION_PRODUCTO
      const newConfigData = [
          {
              id_item_producto: itemId,
              id_opcion_variacion: req.body.id_opcion_variacion
          },
          {
              id_item_producto: itemId,
              id_opcion_variacion: req.body.id_opcion_variacion_1
          }
      ];

      const queryConfig = `INSERT INTO CONFIGURACION_PRODUCTO (id_item_producto, id_opcion_variacion) 
                           VALUES (:id_item_producto, :id_opcion_variacion)`;
      for (const data of newConfigData) {
          const bindsConfig = data;
          result = await connection.execute(queryConfig, bindsConfig, { autoCommit: true });
          console.log("Inserted into CONFIGURACION_PRODUCTO:", result.rowsAffected);
      }
  } else {
      // Insertar solo una vez en CONFIGURACION_PRODUCTO
      const newConfigData = {
          id_item_producto: itemId,
          id_opcion_variacion: req.body.id_opcion_variacion
      };

      const queryConfig = `INSERT INTO CONFIGURACION_PRODUCTO (id_item_producto, id_opcion_variacion) 
                           VALUES (:id_item_producto, :id_opcion_variacion)`;
      const bindsConfig = newConfigData;

      result = await connection.execute(queryConfig, bindsConfig, { autoCommit: true });
      console.log("Inserted into CONFIGURACION_PRODUCTO:", result.rowsAffected);
  }

  console.log("Inserted into Oracle:", result.rowsAffected);
  res.json({ success: true, name: req.body.nombre_producto });
}





  
  app.get("/categories", async (req, res) => {
    try {
      const categorias = await obtenerCategorias();
      res.json(categorias);
    } catch (error) {
      console.error("Error al obtener las categorías desde Oracle:", err.message);
      throw err;
    }
  });

  async function obtenerCategorias() {
    let connection;
    try {
      connection = await oracledb.getConnection();
      const query = `
  SELECT id, nombre_categoria
  FROM CATEGORIA_PRODUCTO cp1
  WHERE NOT EXISTS (
      SELECT 1
      FROM CATEGORIA_PRODUCTO cp2
      WHERE cp1.id = cp2.id_categoria_padre
  )
`;

      const result = await connection.execute(query);
      // Mapear correctamente los resultados
      return result.rows.map(row => ({
        id: row[0],
        nombre_categoria: row[1]
      }));
    } catch (err) {
      console.error("Error al obtener las categorías desde Oracle:", err.message);
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error("Error al cerrar la conexión:", err.message);
        }
      }
    }
  }
  
  
  
  app.get("/variations", async (req, res) => {
    try {
      const variaciones = await obtenerVariaciones();
      res.json(variaciones);
    } catch (error) {
      console.error("Error al obtener las variaciones desde Oracle:", err.message);
      throw err;
    }
  });

  async function obtenerVariaciones() {
    let connection;
    try {
      connection = await oracledb.getConnection();
      const query = `SELECT id, nombre FROM VARIACION`;
      const result = await connection.execute(query);
      // Mapear correctamente los resultados
      return result.rows.map(row => ({
        id: row[0],
        nombre: row[1]
      }));
    } catch (err) {
      console.error("Error al obtener las variaciones desde Oracle:", err.message);
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error("Error al cerrar la conexión:", err.message);
        }
      }
    }
  }
  
  
  app.get("/options", async (req, res) => {
    try {
      const idVariacion = req.query.idVariacion;
      const opcionesVariacion = await obtenerOpcionesVariacion(idVariacion);
      res.json(opcionesVariacion);
    } catch (error) {
      console.error("Error al obtener las opciones desde Oracle:", err.message);
      throw err;
    }
  });
  
  async function obtenerOpcionesVariacion(idVariacion) {
    let connection;
    try {
      connection = await oracledb.getConnection();
      const query = `SELECT id, valor FROM OPCION_VARIACION WHERE id_variacion = :idVariacion`;
      const result = await connection.execute(query, [idVariacion]);
      // Mapear correctamente los resultados
      return result.rows.map(row => ({
        id: row[0],
        valor: row[1]
      }));
    } catch (err) {
      console.error("Error al obtener las opciones desde Oracle:", err.message);
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error("Error al cerrar la conexión:", err.message);
        }
      }
    }
  }
  
  
  app.post("/removeproduct", async (req, res) => {
    let itemProductConnection;
  
    try {
      const productId = req.body.id;
  
      // Obtener una nueva conexión
      itemProductConnection = await oracledb.getConnection(dbConfig);
  
      // Iniciar la transacción y ejecutar las consultas SQL dentro de ella
      const query = `
        DECLARE
          PRAGMA AUTONOMOUS_TRANSACTION;
        BEGIN
          -- Eliminar registros de item_producto
          UPDATE ITEM_PRODUCTO SET estado = 3 WHERE id_producto = :id;
          -- Eliminar producto de la tabla producto
          UPDATE PRODUCTO SET estado = 3 WHERE id = :id;
          -- Confirmar la transacción
          COMMIT;
        END;
      `;
      const binds = { id: productId };
      await itemProductConnection.execute(query, binds, { autoCommit: true });
  
      console.log("Producto eliminado correctamente");
  
      res.json({ success: true, message: "Producto eliminado correctamente" });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, error: "Error al eliminar el producto" });
    } finally {
      // Cerrar la conexión
      if (itemProductConnection) {
        try {
          await itemProductConnection.close();
        } catch (closeError) {
          console.error("Error al cerrar la conexión:", closeError);
        }
      }
    }
  });
  
  async function getCategoryById(categoryId) {
    let connection;
    try {
      connection = await oracledb.getConnection(dbConfig);
      const result = await connection.execute(
        `SELECT * FROM CATEGORIA_PRODUCTO WHERE id = :categoryId`, { categoryId }
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error al obtener la categoría por ID:', error.message);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('Error al cerrar la conexión:', closeError);
        }
      }
    }
  }
  
  app.post('/addcategory', async (req, res) => {
    let connection;
  
    try {
      const { name, parentId } = req.body;
  
      // Verificar si parentId es válido
      const parentCategory = parentId && await getCategoryById(parentId);
      if (parentId && !parentCategory) {
        throw new Error('El parentId proporcionado no es válido');
      }
  
      const query = `
        INSERT INTO CATEGORIA_PRODUCTO
        ${parentId ? '(id_categoria_padre, nombre_categoria)' : '(nombre_categoria)'}
        VALUES ${parentId ? '(:parentId, :name)' : '(:name)'}
      `;
  
      const binds = parentId ? { parentId, name } : { name };
  
      connection = await oracledb.getConnection(dbConfig);
      await connection.execute(query, binds, { autoCommit: true });
  
      console.log('Categoría añadida correctamente');
  
      res.json({ success: true, message: 'Categoría añadida correctamente' });
    } catch (error) {
      console.error('Error al agregar la categoría:', error.message);
      res.status(500).json({ success: false, error: 'Error al agregar la categoría' });
    } finally {
      // Cerrar la conexión
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('Error al cerrar la conexión:', closeError);
        }
      }
    }
  });
  
  

  app.get("/parentcategories", async (req, res) => {
    try {
      const connection = await oracledb.getConnection(dbConfig);
      const result = await connection.execute(
        `SELECT id, nombre_categoria FROM CATEGORIA_PRODUCTO`
      );
      await connection.close();
      res.json(result.rows.map(row => ({
        id: row[0],
        nombre_categoria: row[1]
      })));
    } catch (error) {
      console.error('Error fetching parent categories:', error);
      res.status(500).json([]);
    }
  });
  
  // Obtener los detalles del producto desde la tabla ITEM_PRODUCTO basándose en el id_producto
app.get("/itemproducts", async (req, res) => {
  try {
    const productId = req.query.id_producto;
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT id, cantidad_disp, precio, estado FROM ITEM_PRODUCTO WHERE id_producto = :productId`, [productId]
    );
    await connection.close();
    res.json(result.rows.map(row => ({
      id: row[0],
      cantidad_disp: row[1],
      precio: row[2],
      estado: row[3]
    })));
  } catch (error) {
    console.error('Error fetching item products:', error);
    res.status(500).json([]);
  }
});



app.get("/searchproduct", async (req, res) => {
  let connection; // Declare connection variable outside try block
  try {
    const searchTerm = req.query.search ? req.query.search.toLowerCase() : ""; // Convertir a minúsculas y manejar el caso en el que no se proporciona ningún término de búsqueda
    connection = await oracledb.getConnection(dbConfig);
    
    // Ejecutar la consulta para buscar productos que contengan el término de búsqueda en el nombre del producto
    const result = await connection.execute(
      `SELECT p.id, p.nombre_producto, p.descripcion_producto, p.imagen_producto1, c.nombre_categoria
       FROM PRODUCTO p
       INNER JOIN CATEGORIA_PRODUCTO c ON p.id_categoria = c.id
       WHERE LOWER(p.nombre_producto) LIKE '%' || :searchTerm || '%' AND p.estado = 1`,
      { searchTerm }
    );

    // Enviar los productos que coinciden con la búsqueda como respuesta
    res.json(result.rows.map(row => ({
      id: row[0],
      nombre_producto: row[1],
      descripcion_producto: row[2],
      imagen_producto1: row[3],
      nombre_categoria: row[4]
    })));
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: "Error searching products" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});


app.get("/productos", async (req, res) => {
  let connection; // Declarar variable de conexión fuera del bloque try
  try {
    const searchTerm = req.query.search ? req.query.search.toLowerCase() : ""; // Convertir a minúsculas y manejar el caso en el que no se proporciona ningún término de búsqueda
    connection = await oracledb.getConnection(dbConfig);
    
    // Ejecutar la consulta para buscar productos que contengan el término de búsqueda en el nombre del producto
    const result = await connection.execute(
      `SELECT p.id, p.nombre_producto, p.descripcion_producto, p.imagen_producto1, c.nombre_categoria
       FROM PRODUCTO p
       INNER JOIN CATEGORIA_PRODUCTO c ON p.id_categoria = c.id
       WHERE LOWER(p.nombre_producto) LIKE '%' || :searchTerm || '%' AND p.estado = 1`,
      { searchTerm }
    );

    // Enviar los productos que coinciden con la búsqueda como respuesta
    res.json(result.rows.map(row => ({
      id: row[0],
      nombre_producto: row[1],
      descripcion_producto: row[2],
      imagen_producto1: row[3],
      nombre_categoria: row[4]
    })));
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: "Error searching products" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

app.get("/itemproducts/:productId", async (req, res) => {
  let connection;
  
  try {
    const productId = req.params.productId;

    // Establece la conexión con la base de datos
    connection = await oracledb.getConnection(dbConfig);

    // Ejecuta la consulta para obtener los ITEM_PRODUCTO asociados al producto seleccionado
    const result = await connection.execute(
      `SELECT id, cantidad_disp, precio, estado
       FROM ITEM_PRODUCTO
       WHERE id_producto = :productId`,
      [productId]
    );

    // Envia los ITEM_PRODUCTO como respuesta
    res.json(result.rows.map(row => ({
      id: row[0],
      cantidad_disp: row[1],
      precio: row[2],
      estado: row[3]
    })));
  } catch (error) {
    console.error('Error fetching item products:', error);
    res.status(500).json({ error: "Error al obtener los ITEM_PRODUCTO" });
  } finally {
    // Cierra la conexión
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error(error);
      }
    }
  }
});

app.get("/itemproducttitles/:productId", async (req, res) => {
  let connection;

  try {
    const productId = req.params.productId;

    // Establece la conexión con la base de datos
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los títulos de los ITEM_PRODUCTO
    const query = `
      SELECT op.valor
      FROM CONFIGURACION_PRODUCTO cp
      INNER JOIN OPCION_VARIACION op ON cp.id_opcion_variacion = op.id
      WHERE cp.id_item_producto IN (
        SELECT id
        FROM ITEM_PRODUCTO
        WHERE id_producto = :productId
      )
    `;
    const result = await connection.execute(query, [productId]);

    // Construye un array de títulos
    const titles = result.rows.map(row => row[0]);

    res.json({ titles });
  } catch (error) {
    console.error('Error fetching item product titles:', error);
    res.status(500).json({ error: "Error al obtener los títulos de los ITEM_PRODUCTO" });
  } finally {
    // Cierra la conexión
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error(error);
      }
    }
  }
});

app.post('/updateitemproduct', async (req, res) => {
  let connection;
  try {
    console.log("Request received:", req.body); // Log the request body
    const { id, cantidad_disp, precio, estado } = req.body;

    // Establish connection with the database
    connection = await oracledb.getConnection(dbConfig);

    // Begin transaction and execute SQL queries within it
    const query = `
      DECLARE
        PRAGMA AUTONOMOUS_TRANSACTION;
      BEGIN
        -- Update records in ITEM_PRODUCTO
        UPDATE ITEM_PRODUCTO SET cantidad_disp = :cantidad_disp, precio = TO_NUMBER(:precio, '9999999999.99', 'NLS_NUMERIC_CHARACTERS = ''.,'''), estado = :estado WHERE id = :id;
        -- Commit the transaction
        COMMIT;
      END;
    `;
    const binds = { id, cantidad_disp, precio, estado };
    await connection.execute(query, binds, { autoCommit: true });

    // Send success response
    console.log("Item updated successfully");
    res.json({ success: true, message: '¡Item actualizado exitosamente!' });
  } catch (error) {
    // Log and send error response
    console.error('Error al actualizar el item:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el item' });
  } finally {
    // Close the database connection
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error al cerrar la conexión:', closeError);
      }
    }
  }
});



app.listen(port, (error) => {
  if (!error) console.log("Server Running on port " + port);
  else console.log("Error : ", error);
});
