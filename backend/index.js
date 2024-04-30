const port = 4000;
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const oracledb = require('oracledb');

app.use(express.json());
app.use(cors());

// Database Connection With Oracle Express
const dbConfig = {
  user: 'SYSTEM',
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


//Image Storage Engine 
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
      console.log(file);
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({storage: storage})
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:4000/images/${req.file.filename}`
    })
})
app.use('/images', express.static('upload/images'));

// MiddleWare to fetch user from database
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};



//Create an endpoint at ip/login for login the user and giving auth-token
app.post('/login', async (req, res) => {
  console.log("Login");
    let success = false;
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id
                }
            }
			success = true;
      console.log(user.id);
			const token = jwt.sign(data, 'secret_ecom');
			res.json({ success, token });
        }
        else {
            return res.status(400).json({success: success, errors: "please try with correct email/password"})
        }
    }
    else {
        return res.status(400).json({success: success, errors: "please try with correct email/password"})
    }
})


app.get("/allproducts", async (req, res) => {

});
// No usar
app.get("/newcollections", async (req, res) => {


});
// No Usar
app.get("/popularinwomen", async (req, res) => {

});
// DESPUÉS
//Create an endpoint for saving the product in cart
app.post('/addtocart', fetchuser, async (req, res) => {

  })
//DESPUES
  //Create an endpoint for saving the product in cart
app.post('/removefromcart', fetchuser, async (req, res) => {
//DESPUES
  })

  //Create an endpoint for saving the product in cart
app.post('/getcart', fetchuser, async (req, res) => {


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
    
    // Insertar en Oracle
    const queryProducto = `INSERT INTO PRODUCTO (id_categoria, nombre_producto, descripcion_producto, imagen_producto1, imagen_producto2, imagen_producto3, estado) VALUES (:id_categoria, :nombre_producto, :descripcion_producto, :imagen_producto1, :imagen_producto2, :imagen_producto3, :estado) RETURNING id INTO :id`;
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
  
    oracledb.getConnection(async (err, connection) => {
      try {
        let result = await connection.execute(queryProducto, bindsProducto, { autoCommit: true });
        const newProductId = result.outBinds.id[0]; // Obtener el ID generado
        
        // Insertar en ITEM_PRODUCTO
        const newItemData = {
          id_producto: newProductId,
          cantidad_disp: req.body.cantidad,
          precio: Number(parseFloat(req.body.precio).toFixed(2)),
          estado: req.body.estado,
        };
        
        
        const queryItem = `INSERT INTO ITEM_PRODUCTO (id_producto, cantidad_disp, precio, estado) VALUES (:id_producto, :cantidad_disp, :precio, :estado) RETURNING id INTO :id`;
        const bindsItem = {
          id_producto: newItemData.id_producto,
          cantidad_disp: newItemData.cantidad_disp,
          precio: newItemData.precio,
          estado: newItemData.estado,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        };

        let itemId;
        
        result = await connection.execute(queryItem, bindsItem, { autoCommit: true });
        itemId = result.outBinds.id[0];

        const newConfigData = {
          id_item_producto: itemId,
          id_opcion_variacion: req.body.id_opcion_variacion
        };

        const queryConfig = `INSERT INTO CONFIGURACION_PRODUCTO (id_item_producto, id_opcion_variacion) VALUES (:id_item_producto, :id_opcion_variacion)`;
        const bindsConfig = newConfigData;

        result = await connection.execute(queryConfig, bindsConfig, { autoCommit: true });
        console.log("Inserted into CONFIGURACION_PRODUCTO:", result.rowsAffected);

        console.log("Inserted into Oracle:", result.rowsAffected);
        res.json({ success: true, name: req.body.nombre_producto });
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: "Error al insertar el producto en Oracle Express" });
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


app.post("/removeproduct", async (req, res) => {
  const productIdToRemove = req.body.product_id; // Se espera que el cliente envíe el ID del producto a eliminar
  
  const queryUpdateItemConfigState = `UPDATE CONFIGURACION_PRODUCTO SET estado = 3 WHERE id_item_producto IN (SELECT id FROM ITEM_PRODUCTO WHERE id_producto = :product_id)`;
  const queryUpdateItemState = `UPDATE ITEM_PRODUCTO SET estado = 3 WHERE id_producto = :product_id`;
  const queryUpdateProductState = `UPDATE PRODUCTO SET estado = 3 WHERE id = :product_id`;

  const bindsUpdateState = {
    product_id: productIdToRemove
  };

  oracledb.getConnection(async (err, connection) => {
    try {
      // Actualizar estado en CONFIGURACION_PRODUCTO
      let result = await connection.execute(queryUpdateItemConfigState, bindsUpdateState, { autoCommit: true });
      console.log("Updated CONFIGURACION_PRODUCTO state:", result.rowsAffected);

      // Actualizar estado en ITEM_PRODUCTO
      result = await connection.execute(queryUpdateItemState, bindsUpdateState, { autoCommit: true });
      console.log("Updated ITEM_PRODUCTO state:", result.rowsAffected);

      // Actualizar estado en PRODUCTO
      result = await connection.execute(queryUpdateProductState, bindsUpdateState, { autoCommit: true });
      console.log("Updated PRODUCTO state:", result.rowsAffected);

      res.json({ success: true, message: "Producto eliminado correctamente" });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: "Error al eliminar el producto en Oracle Express" });
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




app.listen(port, (error) => {
  if (!error) console.log("Server Running on port " + port);
  else console.log("Error : ", error);
});
