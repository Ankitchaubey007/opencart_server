const jwt = require('jsonwebtoken');
const express = require('express');

const app = express();
const mysql = require('mysql');

const bodyparser = require('body-parser');
app.use(bodyparser.json());

const secret = 'jbhsdkyuacgdbacsduayvdksadbugcfufyuisvcsavfbdcnfg';

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'opencart'
});


// -------------------database connection-----------------//

connection.connect((err) => {
    if (err) {
        console.error('error connecting database : ' + err.stack);
        return;
    }
    console.log('database connected as id ' + connection.threadId);


});


// -------------------database connection END-----------------//


//--------------------admin api-------------------------------

app.get('/', (req, res) => {
    req.send('hello octoedge');
});

app.post('/staff_login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (username.length < 3 || password.length < 4) {
        res.status(401).send({
            success: false,
            msg: "usename or password is invalid",
            data: [],
            length: 0
        })
    } else {
        const query = `SELECT * FROM admin WHERE username LIKE ? AND password LIKE ?`;
        connection.query(query, [username, password], (err, result) => {
            if (err) {
                res.status(501).send({
                    success: false,
                    msg: err.sqlMessage,
                    data: [],
                    length: 0
                })
            } else if (result.length < 1) {
                res.status(404).send({
                    success: false,
                    msg: "invalid login details",
                    data: [],
                    length: 0
                })
            } else {
                const admin = result[0];
                if (admin.is_active == 1) {
                    let jwtData = {
                        id: admin['admin_id'],
                        username: username,
                        role: admin['role']
                    };
                    const token = jwt.sign(jwtData, secret, { expiresIn: "24h" });
                    res.status(200).send({
                        success: true,
                        msg: "login successful",
                        data: token,
                        length: 1
                    });
                } else {
                    res.status(401).send({
                        seccess: false,
                        msg: "account is not active",
                        data: [],
                        length: 0
                    });
                }
            }
        })

    }
});

app.post("/add_staff", (req, res) => {
    const token = req.headers['token'];
    if (token) {
        let decoded = undefined;
        try {
            decoded = jwt.verify(token, secret);
        } catch (err) {
            res.status(401).send({
                success: false,
                msg: "invalid token",
                data: [],
                length: 0

            });
        }
        if (decoded.role == 'admin') {
            const username = req.body.username;
            const password = req.body.password;
            const role = req.body.role;
            const add_staff_query = `INSERT INTO admin (username,password,role) VALUES (?,?,?)`;
            connection.query(add_staff_query, [username, password, role], (err, data) => {
                if (err) {
                    req.send({
                        success: false,
                        error: err.sqlMessage,
                        data: []
                    })
                } else {
                    res.send({
                        success: true,
                        error: "",
                        data: "staff added"
                    });
                }
            });
        } else {
            res.status(401).send({
                success: false,
                msg: "you are not authorized to perform this action",
                data: [],
                length: 0
            });
        }
    } else {
        res.send({
            seccess: false,
            error: "Invalid Token",
            data: []
        });
    }
});




app.put("/update_staff/:id", (req, res) => {
    const token = req.headers['token'];
    if (token) {
        let decoded = undefined;
        try {
            decoded = jwt.verify(token, secret);
        } catch (err) {
            res.status(401).send({
                success: false,
                msg: "invalid token",
                data: [],
                length: 0
            });
        }
        if (decoded == 'admin') {
            const id = req.params.id;
            const username = req.body.username;
            const password = req.body.password;
            const role = req.body.role;
            const is_active = req.body.is_active;
            const update_staff_query = `UPDATE admin SET username ?, password =?,role =?,is_active =? WHERE admin_id =?`;
            connection.query(update_staff_query, [username, password, role, is_active, id], (err, data) => {
                if (err) {
                    res.send({
                        success: false,
                        error: err.sqlMessage,
                        data: []
                    });
                } else {
                    res.send({
                        success: true,
                        error: "",
                        data: "staff updated"
                    });
                }
            });
        } else {
            res.status(401).send({
                success: false,
                msg: "you are not authorized to perform this action",
                data: [],
                length: 0
            });
        }
    } else {
        res.send({
            success: false,
            error: "invalid token",
            data: []
        });
    }
});

app.put("/update_staff_password/:id", async (req, res) => {
    const token = req.headers['token'];
    const decoded = await verify_token(token, secret, res);
    if (decoded && decoded.role == 'staff' && decoded.id == req.params.id) {
        const id = req.params.id;
        const old_password = req.body.old_password;
        const new_password = req.body.new_password;
        const confirm_password = req.body.confirm_password;
        if (new_password == confirm_password) {
            const update_staff_query = `UPDATE admin SET password =? WHERE admin_id =? AND password = ?`;
            connection.query(update_staff_query, [new_password, id, old_password], (err, data) => {
                if (err) {
                    res.send({
                        seccess: false,
                        error: err.sqlMessage,
                        data: []
                    })
                } else {
                    res.send({
                        success: true,
                        error: "",
                        data: "staff updated"
                    });
                }
            });
        }
    }
});

//--------------------admin api end-------------------------------


//--------------------category apis---------------------------
app.post('/add_category', (req, res) => {
    const token = req.headers['token'];
    let decoded = undefined;
    try {
        decoded = jwt.verify(token, secret);
    } catch (err) {
        res.status(401).send({
            success: false,
            msg: "Invalid Token",
            data: [],
            length: 0
        });
    }
    if (decoded.role == 'admin' || decoded.role == 'staff') {
        const category_name = req.body.category_name;
        const add_category_query = `INSERT INTO category (category_name) VALUES (?)`;
        connection.query(add_category_query, [category_name], (err, data) => {
            if (err) {
                res.send({
                    success: false,
                    error: err.sqlMessage,
                    data: []
                });
            } else {
                res.send({
                    success: true,
                    error: "",
                    data: "category added"
                });
            }
        });
    }
});

app.put("/update_category/:id", (req, res) => {
    const token = req.headers['token'];
    if (token) {
        let decoded = undefined;
        try {
            decoded = jwt.verify(token, secret);
        } catch (err) {
            res.status(401).send({
                success: false,
                msg: "Invalid Token",
                data: [],
                length: 0
            });
        }
        if (decoded.role == 'admin' || decoded.role == 'staff') {
            const id = req.params.id;
            const category_name = req.body.category_name;
            const update_category_query = `UPDATE category SET category_name = ? WHERE category_id = ?`;
            connection.query(update_category_query, [category_name, id], (err, data) => {
                if (err) {
                    res.send({
                        success: false,
                        error: err.sqlMessage,
                        data: []
                    });
                } else {
                    res.send({
                        success: true,
                        error: "",
                        data: "category updated"
                    });
                }
            });
        } else {
            res.status(401).send({
                success: false,
                msg: "you are not authorized to perform this action",
                data: [],
                length: 0
            });
        }
    } else {
        res.send({
            success: false,
            error: "Invalid Token",
            data: []
        });
    }
});
app.put("/update_category_status/:id/:status", (req, res) => {
    const token = req.headers['token'];
    if (token) {
        let decoded = undefined;
        try {
            decoded = jwt.verify(token, secret);
        } catch (err) {
            res.status(401).send({
                success: false,
                msg: "Invalid Token",
                data: [],
                length: 0
            });
        }
        if (decoded.role == 'admin' || decoded.role == 'staff') {
            const id = req.params.status;
            const update_category_query = `UPDATE category SET is_active = ? WHERE category_id = ?`;
            connection.query(update_category_query, [status, id], (err, data) => {
            if (err) {
                res.send({
                    success: false,
                    error: err.sqlMessage,
                    data: []
                });
            }else {
                res.send({
                    success: true,
                    error: "",
                    data: "category updated"
                });
            }
            });
        }else {
            res.status (401).send ({
                success: false,
                msg: "you are not authorized to perform this action",
                data: [],
                length: 0
            });
        }
    }else{
        res.send({
            success: false,
            error: "Invalid Token",
            data: []
        });
    }
});

//--------------------category apis END-----------------------


//--------------------product apis----------------------------

app.post('/add_product', async (req, res) => {
    const token = req.headers ['token'];
    const decoded = await verify_token( token, secret, res);
    if (decoded){
        const product_name = req.body.product_name;
        const price = req.body.price;
        const mrp = req.body.mrp;
        const discount = req.body.discount;
        const image = req.body.image;
        const info = req.body.info;
        const category_id = req.body.category_id;
        const ratings = req.body.ratings;
        const stock = req.body.stock;
        const is_available = req.body.is_available;
        const add_product_query = `INSERT INTO product ( product_name, price, mrp, discount, image, info, category_id,ratings, stoke, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        connection.query(add_product_query, [product_name, price, mrp, discount, image, info, category_id, ratings, stoke, is_available,], (err, data) => {
            if(err){
                res.send({
                    success:false,
                    error: err.sqlMessage,
                    data: []
                });
            } else{
                res.send({
                    success:true,
                    error: "",
                    data: "product added"
                });
            }
        });
    }
});

app.put("/update_product/id", async (req, res) =>{
    const token =req.headers['token'];
    const decoded = await verify_token(token, secret, res);
    if(decoded) {
        const id =req.params.id;
        const product_name = req.body.product_name;
        const price = req.body.price;
        const mrp = req.body.mrp;
        const discount = req.body.discount;
        const image = req.body.image;
        const info = req.body.info;
        const category_id = req.body.category_id;
        const ratings = req.body.ratings;
        const stock = req.body.stock;
        const is_available = req.body.is_available;
        const update_product_query =`UPDATE product SET product_name = ?, price= ?, mrp= ?,discount = ?,image = ?, info = ?, category_id = ?, rating = ?, stock = ?, is_available = ? WHERE product_id = ?`;
        connection.query (update_product_query, [product_name, price, mrp, discount, image, info, category_id, ratings, stock, is_available, id], (err, data) => {
            if(err){
                res.send({
                    success: false,
                    error:err.sqlMessage,
                    data:[]
                });
            } else{
                res.send({
                    success: true,
                    error: "",
                    data: "product updated"
                });
            }
        });
    }
});

app.get ("/get_all_products_by_category/:category_id", (req, res) =>{
    const category_id = req.params.category_id;
    const get_all_products_query = `SELECT * FROM product WHERE category_id = ?`;
    connection.query (get_all_products_query, [category_id],(err,data) => {
        if (err) {
            res.send({
                success: false,
                msg: err.sqlMessage,
                data: []
            });
        } else {
            res.send ({
                success: true,
                msg: "",
                data: data,
                length: data.length
            });
        }
    });
});

//-----------------------product apis END------------------

app.post('/add_order_items', (req, res) => {
    const order_id = req.body.order_id;
    const product_id = req.body.product_id;
    const qty = req.body.qty;
    const price = req.body.price;
    const discount = req.body.discount;
    const mrp = req.body.mrp;
    const token = req.headers['token'];
    let decoded = undefined;
    try {
        decoded = jwt.verify (token, secret);
    } catch (err) {
        console.log (err);
        req.send ({
            success: false,
            err: "Invalid Token",
            data:[]
        });
    }
    console.log (decoded);
    if(decoded.role == "admin") {
        const query = `INSERT INTO order_items(order_id, product_id, qty, price, discount, mrp)
        VALUES ('${order_id}', '${product_id}', '${qty}', '${price}', '${discount}', '${mrp}',)`;
        connection.query(query, (err, data) =>{
            if (err){
                res.send({
                    success: false,
                    error: err.sqlMessage,
                    data: []
                });
            } else {
                res.send({
                    success: true,
                    error: '',
                    data: 'order_items added'
                });
            }
        });
    } else{
        res.send ({
            success: false,
            error: "you are not authorized to add order_items",
            data: []
        });
    }
});

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});

function verify_token (token, secret, res){
    return new Promise ((resolve, reject) => {
        jwt.verify(token,secret, (err, decoded) => {
            if (err){
                res.status(401).send({
                    success: false,
                    msg:"Invalid Token",
                    data: [],
                    length: 0
                });
                resolve(undefined);
            }else{
                resolve (decoded);
            }
        });
    });
}