const express = require("express");
const exphbs = require("express-handlebars");
const session = require("express-session");
const request = require("request");
const credentials = require("./credentials.js");

const app = express();

app.engine("hbs", exphbs({ extname: "hbs" }));
app.set("view engine", "hbs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.set("port", 3000);

const getQueryParams = (req, res, next) => {
  let queryData = [];
  for (let p in req.query) {
    queryData.push({ name: p, value: req.query[p] });
  }
  res.locals.queryParams = queryData;
  next();
};
app.use(getQueryParams);

app.get("/", (req, res) => {
  let context = { showTitle: true, title: "Did I Beat the Market?" };
  res.render("carousel", context);
});

app.get("/my-assets", (req, res) => {
  res.render("myAssets");
});

app.get("/performance", (req, res) => {
  res.render("performance");
});

app.get("/about", (req, res) => {
  res.render("about");
});

// app.get("/", (req, res, next) => {
//   let context = {};
//   context.stockPrices = [];
//   request(
//     `http://api.openweathermap.org/data/2.5/weather?q=corvallis&APPID=${credentials.owmKey}`,
//     handleGet
//   );
//   request(
//     `http://api.openweathermap.org/data/2.5/weather?q=seattle&APPID=${credentials.owmKey}`,
//     handleGet
//   );
//
//   function handleGet(error, response, body) {
//     if (!error && response.statusCode < 400) {
//       context.weather.push({ value: body });
//       request(
//         {
//           url: "http://httpbin.org/post",
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: '{"foo":"bar","number":1}',
//         },
//         handlePost
//       );
//     } else {
//       if (response) {
//         console.log(response.statusCode);
//       }
//       console.log(error);
//       next(error);
//     }
//   }
//
//   function handlePost(error, response, body) {
//     if (!error && response.statusCode < 400) {
//       context.httpbin = body;
//       res.render("weather", context);
//     } else {
//       if (response) {
//         console.log(response.statusCode);
//       }
//       console.log(error);
//       next(error);
//     }
//   }
// });

// app.get("/", (req, res) => {
//   console.log(`========================`);
//   console.log(req);
//   console.log(`========================`);
//   console.log(req.sessionStore);
//   console.log(`========================`);
//   console.log(req.session);
//   console.log(`========================`);
//   console.log(req.session.id);
//   console.log(`========================`);
//   res.send(null);
// });

app.use((req, res) => {
  res.status(404);
  res.render("404");
});

app.use((err, req, res, next) => {
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
