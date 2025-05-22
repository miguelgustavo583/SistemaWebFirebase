const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./SistemaWebFirebase.json"); // Nome atualizado

initializeApp({
    credential: cert(serviceAccount)
})

const db = getFirestore()

app.engine("handlebars", exphbs.engine({
    defaultLayout: "main",
    helpers: {
        eq: (a, b) => a === b
    }
}));
app.set("view engine", "handlebars")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get("/", function (req, res) {
    res.render("primeira_pagina")
})

app.get("/consulta", async function (req, res) {
    try {
        const agendamentosRef = db.collection('agendamentos');
        const snapshot = await agendamentosRef.get();

        const agendamentos = [];
        snapshot.forEach(doc => {
            agendamentos.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.render("consulta", { agendamentos });
    } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
        res.status(500).send("Erro ao consultar agendamentos.");
    }
})

app.get("/editar/:id", async function (req, res) {
    const id = req.params.id;

    try {
        const doc = await db.collection('agendamentos').doc(id).get();
        if (!doc.exists) {
            return res.status(404).send("Agendamento não encontrado");
        }

        const agendamento = doc.data();
        agendamento.id = doc.id;

        res.render('editar', { agendamento });
    } catch (erro) {
        res.send("Erro ao buscar agendamento: " + erro);
    }
});

app.post("/cadastrar", function (req, res) {
    var result = db.collection('agendamentos').add({
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
    }).then(function () {
        console.log('Added document');
        res.redirect('/')
    })
})

app.post("/atualizar/:id", async function (req, res) {
    const id = req.params.id
    const { nome, telefone, origem, data_contato, observacao } = req.body

    try {
        await db.collection('agendamentos').doc(id).update({
            nome,
            telefone,
            origem,
            data_contato,
            observacao
        });
        res.redirect("/consulta");
    } catch (erro) {
        res.send('Erro ao atualizar agendamento: ' + erro);
    }
})

app.post('/deletar/:id', async function (req, res) {
    const id = req.params.id
    try {
        await db.collection('agendamentos').doc(id).delete();
        res.redirect("/consulta");
    } catch (erro) {
        res.send('Erro ao deletar agendamento: ' + erro);
    }
})

app.listen(8081, function () {
    console.log("Servidor ativo!")
})
