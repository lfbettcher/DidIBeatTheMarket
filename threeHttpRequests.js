const express = require("express");
const handlebars = require("express-handlebars");
const request = require("request");
const credentials = require("./credentials.js");

let app = express();

app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.set("port", 3002);

app.get("/", (req, res, next) => {
  let context = {};
  context.weather = [];
  request(
    `http://api.openweathermap.org/data/2.5/weather?q=corvallis&APPID=${credentials.owmKey}`,
    (error, response, body) => {
      if (!error && response.statusCode < 400) {
        context.weather.push({ value: body });
        request(
          `http://api.openweathermap.org/data/2.5/weather?q=seattle&APPID=${credentials.owmKey}`,
          (error, response, body) => {
            if (!error && response.statusCode < 400) {
              context.weather.push({ value: body });
              request(
                {
                  url: "http://httpbin.org/post",
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: '{"foo":"bar","number":1}',
                },
                (error, response, body) => {
                  if (!error && response.statusCode < 400) {
                    context.httpbin = body;
                    res.render("weather", context);
                  } else {
                    if (response) {
                      console.log(response.statusCode);
                    }
                    next(error);
                  }
                }
              );
            } else {
              console.log(error);
              if (response) {
                console.log(response.statusCode);
              }
              next(error);
            }
          }
        );
      } else {
        if (response) {
          console.log(response.statusCode);
        }
        next(error);
      }
    }
  );
});

app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render("500");
});

app.listen(app.get("port"), () => {
  console.log(
    `Express started on http://localhost:${app.get(
      "port"
    )}; press Ctrl-C to terminate.`
  );
});
