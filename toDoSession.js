const express = require("express");
const handlebars = require("express-handlebars");
const session = require("express-session");

const app = express();

app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: "SuperSecretPassword" }));

app.set("port", 3001);

app.get("/", (req, res, next) => {
  let context = {};
  // if there is no session, render new session page
  if (!req.session.name) {
    res.render("newSession", context);
    return;
  }
  context.name = req.session.name;
  context.toDoCount = req.session.toDo.length || 0;
  context.toDo = req.session.toDo || [];
  console.log(context.toDo);
  res.render("toDo", context);
});

app.post("/", (req, res) => {
  let context = {};

  // coming from new session page has property "New List"
  if (req.body["New List"]) {
    // populate session with new name
    req.session.name = req.body.name;
    req.session.toDo = [];
    req.session.curId = 0;
  }

  // if no session, render new session page
  if (!req.session.name) {
    res.render("newSession", context);
    return;
  }

  if (req.body["Add Item"]) {
    req.session.toDo.push({ name: req.body.name, id: req.session.curId });
    req.session.curId++;
  }

  if (req.body["Done"]) {
    req.session.toDo = req.session.toDo.filter((e) => {
      // keep items that don't match done id
      return e.id != req.body.id;
    });
  }

  context.name = req.session.name;
  context.toDoCount = req.session.toDo.length;
  context.toDo = req.session.toDo;
  console.log(context.toDo);
  res.render("toDo", context);
});

app.listen(app.get("port"), () => {
  console.log(
    `Express started on http://localhost:${app.get(
      "port"
    )}; press Ctrl-C to terminate.`
  );
});
