const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const fs = require('fs');
const basicAuth = require('express-basic-auth');

const app = express();
const port = 3000;

const users = { 'admin': 'secret' };

const basicAuthMiddleware = basicAuth({
    users,
    challenge: true,
    unauthorizedResponse: 'Unauthorized'
});

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

let isAuthenticated = false;

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const enteredUsername = req.body.username;
    const enteredPassword = req.body.password;

    if (enteredUsername === 'admin' && enteredPassword === 'secret') {
        isAuthenticated = true;
        res.redirect('/form');
    } else {
        isAuthenticated = false;
        const error = 'Invalid username or password';
        res.render('login', { error });
    }
});

function enforceAuthMiddleware(req, res, next) {
    if (isAuthenticated) {
        next();
    } else {
        basicAuthMiddleware(req, res, next);
    }
}

app.use('/form', enforceAuthMiddleware);

app.get('/form', (req, res) => {
    if (isAuthenticated) {
        res.render('form', { error: null });
    } else {
        res.redirect('/login');
    }
});

app.post('/form', (req, res) => {
    const formData = req.body;

    if (!/^\d{7}$/.test(formData.filename)) {
        const error = 'Enter 7 digits. Any other form is not acceptable.';
        return res.render('form', { error, formData });
    }

    const filename = formData.filename + '.txt';

    if (fileExists(filename)) {
        const fileContent = readFileContent(filename);
        return res.render('fileResult', { filename, fileContent });
    } else {
        const error = 'Student with this ID does not exist.';
        return res.render('form', { error, formData });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

function fileExists(filename) {
    return fs.existsSync(path.join(__dirname, 'files', filename));
}

function readFileContent(filename) {
    return fs.readFileSync(path.join(__dirname, 'files', filename), 'utf-8');
}
