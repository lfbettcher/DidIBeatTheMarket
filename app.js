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
app.use(session({ secret: "SuperSecretPassword" }));
app.use(express.static("public"));

app.set("port", 3005);

const getQueryParams = (req, res, next) => {
  let queryData = [];
  for (let p in req.query) {
    queryData.push({ name: p, value: req.query[p] });
  }
  res.locals.queryParams = queryData;
  next();
};
app.use(getQueryParams);

const getBodyParams = (req, res, next) => {
  let recData = [];
  for (let param in req.body) {
    recData.push({ name: param, value: req.body[param] });
  }
  res.locals.bodyParams = recData;
  next();
};
app.use(getBodyParams);

app.get("/", (req, res, next) => {
  let context = { homeIsActive: "active" };
  if (!req.session.name) {
    res.render("home", context);
    return;
  }
  context.name = req.session.name;
  res.render("home", context);
});

// app.get("/my-assets", (req, res) => {
//   let context = { assetsIsActive: "active" };
//   res.render("myAssets", context);
// });

app.get("/performance", (req, res) => {
  let context = { performanceIsActive: "active" };
  res.render("performance", context);
});

app.get("/about", (req, res) => {
  let context = { aboutIsActive: "active" };
  res.render("about", context);
});

let queryType = "TIME_SERIES_DAILY";
let stockSymbol = "SPY";
const prices = ["1. open", "2. high", "3. low", "4. close"];
const URL = `https://www.alphavantage.co/query?function=${queryType}&symbol=${stockSymbol}&apikey=${credentials.alphavantageKey}`;

app.get("/my-assets", (req, res, next) => {
  let context = { assetsIsActive: "active" };
  request(URL, (err, response, body) => {
    if (!err && response.statusCode < 400) {
      context.stockData = body;
      res.render("myAssets", context);
    } else {
      if (response) {
        console.log(response.statusCode);
      }
      next(err);
    }
  });
});
// let sentData = [];
// console.log(req.query);
// for (let param in req.query) {
//   sentData.push({ name: param, value: req.query[param] });
// }
// res.locals.queryParams = sentData;
// context.sentData = res.locals.queryParams;
// console.log(context.sentData);
// res.render("myAssets", context);
// });

app.post("/my-assets", (req, res, next) => {
  // let input = {
  //   startDate: req.body.startDate,
  //   startValue: req.body.startValue,
  //   endDate: req.body.endDate,
  //   endValue: req.body.endValue,
  // };
  // for faster testing
  let input = {
    startDate: "2020-07-09",
    startValue: 2134,
    endDate: "2020-07-22",
    endValue: 1234,
  };
  let context = {};
  request(URL, (err, response, body) => {
    if (!err && res.statusCode < 400) {
      let stockData = JSON.parse(body);
      let startDatePrices = stockData["Time Series (Daily)"][input.startDate];
      let avgStartDatePrice = averagePrices(startDatePrices);
      console.log(avgStartDatePrice);
      context.startSPYprice = avgStartDatePrice;
      context.startSPYshares = input.startValue / avgStartDatePrice;
      res.render("myAssets", context);
    } else {
      if (response) {
        console.log(response.statusCode);
      }
      next(err);
    }
  });
});

function averagePrices(data) {
  delete data["5. volume"];
  let sum = 0;
  for (let param in data) {
    sum += parseFloat(data[param]);
  }
  return sum / 4;
}
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
