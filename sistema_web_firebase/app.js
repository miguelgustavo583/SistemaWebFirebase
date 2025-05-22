const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./SistemaWebFirebase.json"); // Nome atualizado

// Inicializa Firebase
initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

// Inicializa o app Express
const app = express();

// Configura Handlebars
app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Rota principal (cadastro)
app.get("/", function (req, res) {
  res.render("primeira_pagina");
});

// Rota para cadastrar dados no Firestore
app.post("/cadastrar", function (req, res) {
  db.collection("agendamentos")
    .add({
      nome: req.body.nome,
      telefone: req.body.telefone,
      origem: req.body.origem,
      data_contato: req.body.data_contato,
      observacao: req.body.observacao,
    })
    
    .then(() => {
      console.log("Cadastro realizado com sucesso!");
      res.redirect("/consulta");
    })
    .catch((err) => {
      console.error("Erro ao cadastrar:", err);
      res.send("Erro ao cadastrar");
    });
});

// Rota de consulta de dados
app.get("/consulta", async function (req, res) {
  try {
    const snapshot = await db.collection("agendamentos").get();
    const agendamentos = [];
    snapshot.forEach((doc) => {
      agendamentos.push({ id: doc.id, ...doc.data() });
    });
    res.render("consulta", { agendamentos });
  } catch (err) {
    console.error("Erro ao consultar:", err);
    res.send("Erro ao consultar");
  }
});

// Servidor
const PORT = 8081;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
