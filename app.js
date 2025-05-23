const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const moment = require('moment');

// Inicialização do Firebase
const serviceAccount = require('./sistemawebfirebase-firebase-adminsdk-fbsvc-79748c30a0.json');
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

// Configuração do Handlebars com helpers
const hbs = exphbs.create({
    defaultLayout: 'main',
    helpers: {
        eq: (a, b) => a === b,
        formatDate: function (data) {
            return moment(data).format("DD/MM/YYYY");
        }
    }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Rotas
app.get('/', (req, res) => {
    res.render('primeira_pagina');
});

app.get('/consulta', async (req, res) => {
    try {
        const snapshot = await db.collection('agendamentos').orderBy('data_contato').get();
        const agendamentos = [];
        snapshot.forEach(doc => {
            agendamentos.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.render('consulta', { agendamentos });
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        res.status(500).send('Erro ao consultar agendamentos.');
    }
});

app.get('/editar/:id', async (req, res) => {
    try {
        const doc = await db.collection('agendamentos').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).send('Agendamento não encontrado');
        }

        const agendamento = doc.data();
        agendamento.id = doc.id;

        res.render('editar', { post: agendamento });
    } catch (error) {
        res.send('Erro ao buscar agendamento: ' + error);
    }
});

app.post('/cadastrar', async (req, res) => {
    try {
        await db.collection('agendamentos').add({
            nome: req.body.nome,
            telefone: req.body.telefone,
            origem: req.body.origem,
            data_contato: req.body.data_contato,
            observacao: req.body.observacao
        });
        res.redirect('/consulta');
    } catch (error) {
        res.send('Erro ao cadastrar: ' + error);
    }
});

app.post('/atualizar/:id', async (req, res) => {
    try {
        await db.collection('agendamentos').doc(req.params.id).update({
            nome: req.body.nome,
            telefone: req.body.telefone,
            origem: req.body.origem,
            data_contato: req.body.data_contato,
            observacao: req.body.observacao
        });
        res.redirect('/consulta');
    } catch (error) {
        res.send('Erro ao atualizar agendamento: ' + error);
    }
});

app.post('/deletar/:id', async (req, res) => {
    try {
        await db.collection('agendamentos').doc(req.params.id).delete();
        res.redirect('/consulta');
    } catch (error) {
        res.send('Erro ao deletar agendamento: ' + error);
    }
});

// Inicialização do servidor
app.listen(8081, () => {
    console.log('Servidor rodando em http://localhost:8081');
});
