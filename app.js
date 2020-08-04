const express = require("express");
const exphbs = require("express-handlebars");
const session = require("express-session");
const request = require("request");
const credentials = require("./credentials.js");
const stock = require("./stock");

const app = express();
app.set("port", 9843);

app.engine("hbs", exphbs({ extname: "hbs" }));
app.set("view engine", "hbs");

app.use(session({ secret: "SuperSecretPassword" }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

const getStockNow = (obj) => {
  return stock
    .makeRequest(
      `query?function=TIME_SERIES_INTRADAY&symbol=${obj.stockSymbol}&interval=1min&apikey=${credentials.avKey}`
    )
    .then((response) => {
      let priceData = response.data["Time Series (1min)"];
      let prices = priceData[Object.keys(priceData)[0]];
      let price = prices[Object.keys(prices)[0]];
      obj.stockData = "$" + Number(price).toFixed(2);
    })
    .catch((e) => {
      obj.stockData = "not a stock symbol";
    });
};

app.get("/", (req, res) => {
  req.session.homeIsActive = "active";
  res.render("home", req.session);
});

// keeps a running list of stock quote prices with session
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
  Promise.all(promises).then((values) => {
    res.render("home", req.session);
  });
});

app.get("/my-assets", (req, res) => {
  let todayDate = getTodayDate();
  let context = { assetsIsActive: "active", today: todayDate };
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

app.post("/performance", (req, res) => {
  let selectedFunds = req.body.funds;
  let fundsArr = [];
  if (typeof selectedFunds === "string") {
    fundsArr.push({ name: selectedFunds });
  } else {
    selectedFunds.forEach((fund) => {
      fundsArr.push({ name: fund });
    });
  }
  let context = { performanceIsActive: "active", funds: fundsArr };
  res.render("performance", context);
});

// settings for market comparison
let queryType = "TIME_SERIES_DAILY";
let stockSymbol = "SPY";
const URL = `https://www.alphavantage.co/query?function=${queryType}&symbol=${stockSymbol}&outputsize=full&apikey=${credentials.avKey}`;

app.post("/my-assets", (req, res, next) => {
  let context = { assetsIsActive: "active", today: getTodayDate() };
  let input = {
    startDate: req.body.startDate,
    startValue: req.body.startValue,
    endDate: req.body.endDate,
    endValue: req.body.endValue,
  };
  if (isValidDate(input)) {
    request(URL, (err, response, body) => {
      if (!err && res.statusCode === 200) {
        let stockData = JSON.parse(body);
        let startDatePrice = -1;
        if (stockData["Time Series (Daily)"].hasOwnProperty(input.startDate)) {
          startDatePrice = averagePrices(
            stockData["Time Series (Daily)"][input.startDate]
          );
        }
        let endDatePrice = -1;
        if (stockData["Time Series (Daily)"].hasOwnProperty(input.endDate)) {
          endDatePrice = averagePrices(
            stockData["Time Series (Daily)"][input.endDate]
          );
        }
        if (startDatePrice > 0 && endDatePrice > 0) {
          let calcData = {
            startPrice: startDatePrice,
            endPrice: endDatePrice,
            startValue: input.startValue,
            endValue: input.endValue,
          };
          context.input = input;
          context.result = calculateChange(calcData);
          res.render("myAssets", context);
        } else {
          context.error = true;
          res.render("myAssets", context);
        }
      } else {
        if (response) {
          console.log(response.statusCode);
        }
        next(err);
      }
    });
  } else {
    context.error = true;
    res.render("myAssets", context);
  }
});

function isValidDate(input) {
  let todayDate = getTodayDate();
  return (
    input.startDate < input.endDate &&
    input.startDate < todayDate &&
    input.endDate < todayDate &&
    !isWeekend(input.startDate) &&
    !isWeekend(input.endDate)
  );
}

function getTodayDate() {
  let today = new Date();
  let month = ("0" + (today.getMonth() + 1)).slice(-2);
  let date = ("0" + today.getDate()).slice(-2);
  return `${today.getFullYear()}-${month}-${date}`;
}

function isWeekend(date) {
  // convert "-" to "/" to prevent timezone change
  let date2 = date.replace(/-/g, "/");
  let d2 = new Date(date2);
  return d2.getDay() === 0 || d2.getDay() === 6;
}

function calculateChange(data) {
  let marketChange = (data.endPrice - data.startPrice) / data.startPrice;
  let marketChangePercent = (marketChange * 100).toFixed(2);
  let marketEndValue = (data.startValue * (1 + marketChange)).toFixed(2);
  let myChange = (data.endValue - data.startValue) / data.startValue;
  let myChangePercent = (myChange * 100).toFixed(2);
  let beat = myChange > marketChange;
  return {
    marketEndValue: marketEndValue,
    marketChangePercent: marketChangePercent,
    myChangePercent: myChangePercent,
    beat,
  };
}

function averagePrices(data) {
  try {
    delete data["5. volume"];
    let sum = 0;
    for (let param in data) {
      sum += parseFloat(data[param]);
    }
    return sum / 4;
  } catch (e) {
    return -1;
  }
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
      `Express started on http://${process.env.HOSTNAME}:${app.get(
          "port"
      )}; press Ctrl-C to terminate.`
  );
});
