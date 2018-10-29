const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

const request = require("request");
const cheerio = require('cheerio');

let moment = require('moment');
moment = moment().locale("ko");

//TODO 지역
const SCHOOL_COUNTRY = "dge.go";
//TODO 학교 코드
const SCHOOL_CODE = "D100000282";
//TODO 학교 유형 (병설 유치원 1, 초등 2, 중등 3, 고등 4)
const SCHOOL_TYPE = 4;


const requestOptions = {
    method: "GET" ,
    uri: "https://stu." + SCHOOL_COUNTRY  + ".kr/sts_sci_md00_001.do?schulCode=" + SCHOOL_CODE + "&schulCrseScCode=" + SCHOOL_TYPE + "&schulKndScCode=0" + SCHOOL_TYPE + "&schYm=" + moment.format("YYYYMM")
};

function parseMeal(text) {
    let mode = 0;
    let texts = text.split("\n");
    for (let i = 0; i < texts.length; i++) {
        switch (texts[i]) {
            case "[조식]":
                mode = 0;
                mealBStr = "";
                continue;
            case "[중식]":
                mode = 1;
                mealLStr = "";
                continue;
            case "[석식]":
                mode = 2;
                mealDStr = "";
                continue;
        }
        switch (mode) {
            case 0:
                mealBStr += texts[i] + "\n";
                break;
            case 1:
                mealLStr += texts[i] + "\n";
                break;
            case 2:
                mealDStr += texts[i] + "\n";
                break;
        }
    }
}

const EMPTY_TEXT = "정보가 없습니다.";

let mealBStr = EMPTY_TEXT;
let mealLStr = EMPTY_TEXT;
let mealDStr = EMPTY_TEXT;

request(requestOptions, function (error, response, body) {
    // 사이트 불러오기
    const parse = cheerio.load(body, {
        decodeEntities: false
    });
    // 급식 테이블 확인
    parse('.tbl_type3.tbl_calendar').first().find('tr').each(function () {

        parse(this).find('td').each(function () {
            parse(this).find('div').each(function () {
                let meals = parse(this).html().split("</br>");
                if (!meals.isEmpty)
                    for (let i = 0; i < meals.length; i++) {
                        if (meals[i].includes(moment.format("D").toString() + "<br>")) {
                            meals[i] = meals[i].replace(moment.format("D").toString() + "<br>", "");
                            meals[i] = meals[i].replace(/<br>/g, "\n");
                            parseMeal(meals[i]);
                        }
                    }
            });
        });

    });
    console.log(mealBStr);
    console.log(mealLStr);
    console.log(mealDStr);
    console.log();
    if (moment.day() === 5 && mealDStr.includes(EMPTY_TEXT)) {
        console.log("TIP: 퇴사일로 추정 됨");
    }
    process.exit(0);
});