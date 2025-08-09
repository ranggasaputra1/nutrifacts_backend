var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var userRouter = require("./routes/user");
var productRouter = require("./routes/product");
var app = express();

// view engine setup (you can remove or comment this if not needed)
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'pug');

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/product", productRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler for API
app.use(function (err, req, res, next) {
  // Set the status and message
  res.status(err.status || 500);

  // Send a JSON response instead of rendering a view
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

module.exports = app;
