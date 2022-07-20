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



//--------------------admin api-------------------------------

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});