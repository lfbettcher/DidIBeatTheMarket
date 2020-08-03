const express = require("express");
const exphbs = require("express-handlebars");
const session = require("express-session");
const request = require("request");
const credentials = require("./credentials.js");
const stock = require("./stock");

const app = express();
app.set("port", 3000);

app.engine("hbs", exphbs({ extname: "hbs" }));
app.set("view engine", "hbs");

app.use(session({ secret: "SuperSecretPassword" }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

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

const getStockNow = (obj) => {
  return stock
    .makeRequest(
      `query?function=TIME_SERIES_INTRADAY&symbol=${obj.stockSymbol}&interval=1min&apikey=${credentials.avKey}`
    )
    .then((response) => {
      let priceData = response.data["Time Series (1min)"];
      let prices = priceData[Object.keys(priceData)[0]];
      let price = prices[Object.keys(prices)[0]];
      obj.stockData = Number(price).toFixed(2);
    });
};

app.get("/", (req, res) => {
  // console.log(`========================`);
  // console.log(req);
  console.log(`========================`);
  console.log(req.sessionStore);
  console.log(`========================`);
  // console.log(req.session);
  // console.log(`========================`);
  // console.log(req.session.id);
  // console.log(`========================`);
  // console.log(req.session.cookie);
  req.session.homeIsActive = "active";
  res.render("home", req.session);
});

// keeps a running list of stock quote prices
app.post("/", (req, res) => {
  if (req.session.stocks) {
    req.session.stocks.push(req.body);
  } else {
    req.session.stocks = [req.body];
  }
  let promises = [];
  req.session.stocks.forEach((stock) => {
    promises.push(getStockNow(stock));
  });
  // req.session.homeIsActive = "active";
  Promise.all(promises).then((values) => {
    res.render("home", req.session);
  });
});

app.get("/my-assets", (req, res) => {
  let context = { assetsIsActive: "active" };
  res.render("myAssets", context);
});

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
const URL = `https://www.alphavantage.co/query?function=${queryType}&symbol=${stockSymbol}&apikey=${credentials.avKey}`;

// app.get("/my-assets", (req, res, next) => {
//   let qParams = [];
//   for (let p in req.query) {
//     qParams.push({ name: p, value: req.query[p] });
//   }
//   let context = { assetsIsActive: "active" };
//   context.dataList = qParams;
//   request(URL, (err, response, body) => {
//     if (!err && response.statusCode < 400) {
//       let stockData = JSON.parse(body);
//       let startDatePrices =
//         stockData["Time Series (Daily)"][qParams["startDate"]];
//       let avgStartDatePrice = averagePrices(startDatePrices);
//       console.log(avgStartDatePrice);
//       context.startSPYprice = avgStartDatePrice;
//       context.startSPYshares = qParams["startValue"] / avgStartDatePrice;
//       res.render("myAssets", context);
//     } else {
//       if (response) {
//         console.log(response.statusCode);
//       }
//       res.render("/my-assets", context);
//       next(err);
//     }
//   });
// });

app.post("/my-assets", (req, res, next) => {
  let input = {
    startDate: req.body.startDate,
    startValue: req.body.startValue,
    endDate: req.body.endDate,
    endValue: req.body.endValue,
  };
  // for faster testing
  // let input = {
  //   startDate: "2020-07-09",
  //   startValue: 2134,
  //   endDate: "2020-07-22",
  //   endValue: 3234,
  // };
  // if (input.startDate >= input.endDate) {
  //   // deal with this
  // }
  request(URL, (err, response, body) => {
    if (!err && res.statusCode < 400) {
      let stockData = JSON.parse(body);
      let startDatePrice = averagePrices(
        stockData["Time Series (Daily)"][input.startDate]
      );
      let endDatePrice = averagePrices(
        stockData["Time Series (Daily)"][input.endDate]
      );
      calcData = {
        startPrice: startDatePrice,
        endPrice: endDatePrice,
        startValue: input.startValue,
        endValue: input.endValue,
      };
      result = calculateChange(calcData);
      let context = { assetsIsActive: "active", input, result };
      res.render("myAssets", context);
    } else {
      if (response) {
        console.log(response.statusCode);
      }
      next(err);
    }
  });
});

function calculateChange(data) {
  let marketChange = (data.endPrice - data.startPrice) / data.startPrice;
  let marketChangePercent = (marketChange * 100).toFixed(2);
  let marketEndValue = (data.startValue * (1 + marketChange)).toFixed(2);
  let myChangePercent = (
    ((data.endValue - data.startValue) / data.startValue) *
    100
  ).toFixed(2);
  let beat = myChangePercent > marketChangePercent;
  return {
    marketEndValue: marketEndValue,
    marketChangePercent: marketChangePercent,
    myChangePercent: myChangePercent,
    beat,
  };
}

function averagePrices(data) {
  delete data["5. volume"];
  let sum = 0;
  for (let param in data) {
    sum += parseFloat(data[param]);
  }
  return sum / 4;
}

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
