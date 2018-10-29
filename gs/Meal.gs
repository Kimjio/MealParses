var emptyStr = "정보가 없습니다.";
var mealBStr = emptyStr;
var mealLStr = emptyStr;
var mealDStr = emptyStr;

var SCHOOL_CODE = "D100000282";
var SCHOOL_COUNTRY = "dge.go";
var SCHOOL_TYPE = "4"

function doGet() {

    var date = new Date();
    var afterTime = new Date();
    afterTime.setHours(19);
    try {
        var urlfe = UrlFetchApp.fetch('https://stu.' + SCHOOL_COUNTRY + '.kr/sts_sci_md00_001.do?schulCode=' + SCHOOL_CODE + '&schulCrseScCode=' + SCHOOL_TYPE + '&schulKndScCode=0' + SCHOOL_TYPE + '&schYm=' + Utilities.formatDate(date, "GMT+9", "YYYYMM"), { method: "GET", muteHttpExceptions: true, followRedirects: false })
        var html = urlfe.getContentText();

        if (Number(Utilities.formatDate(date, "GMT+9", "H")) >= Number(Utilities.formatDate(afterTime, "GMT+9", "H"))) {
            date.setDate(date.getDate() + 1);
        }

        //String
        var table = Parser.data(html).from('<table cellspacing="0" summary="이 표는 월간 식단에 관한 달력 정보를 제공하고 있습니다." class="tbl_type3 tbl_calendar">').to('</table>').build();
        var tbody = Parser.data(table).from('<tbody>').to('</tbody>').build();

        tbody.split(/\n/g).forEach(function (mealRaw) {
            // 공백 및 필요 없는 TAG 제거
            mealRaw = mealRaw.replace(/\t/g, '').replace(/<td><div>/g, '').replace(/<\/div><\/td>/g, '');

            if (mealRaw.search(Utilities.formatDate(date, "GMT+9", "d").toString() + "<br />") === 0) {
                mealRaw = mealRaw.replace(Utilities.formatDate(date, "GMT+9", "d").toString() + "<br />", "");
                //상단 날짜 제거
                mealRaw = mealRaw.replace(/<br \/>/g, "\n");
                //급식 뒷 부분 알레르기 번호 및 의미 모를 3 제거
                mealRaw = removeStr(mealRaw);

                parseMeal(mealRaw);
            }
        });
        //마지막 ', ' 제거
        if (mealBStr.search(emptyStr) != 0)
            mealBStr = mealBStr.substring(0, mealBStr.length - 2);
        if (mealLStr.search(emptyStr) != 0)
            mealLStr = mealLStr.substring(0, mealLStr.length - 2);
        if (mealDStr.search(emptyStr) != 0)
            mealDStr = mealDStr.substring(0, mealDStr.length - 3); // 마지막 \n 제거
        //적용
        Logger.log(mealBStr);
        Logger.log(mealLStr);
        Logger.log(mealDStr);
    } catch (e) {
        Logger.log(e);
    }
}

function getE(day) {
    switch (day) {
        case 0: return "일요일 ";
        case 1: return "월요일 ";
        case 2: return "화요일 ";
        case 3: return "수요일 ";
        case 4: return "목요일 ";
        case 5: return "금요일 ";
        case 6: return "토요일 ";
        default: return "";
    }
}

function removeStr(str) {
    return str.replace(/amp;/g, "")
        .replace(/35\./g, "")
        .replace(/20\./g, "")
        .replace(/19\./g, "")
        .replace(/18\./g, "")
        .replace(/17\./g, "")
        .replace(/16\./g, "")
        .replace(/15\./g, "")
        .replace(/14\./g, "")
        .replace(/13\./g, "")
        .replace(/12\./g, "")
        .replace(/11\./g, "")
        .replace(/10\./g, "")
        .replace(/9\./g, "")
        .replace(/8\./g, "")
        .replace(/7\./g, "")
        .replace(/6\./g, "")
        .replace(/5\./g, "")
        .replace(/4\./g, "")
        .replace(/3\./g, "")
        .replace(/2\./g, "")
        .replace(/1\./g, "")
        .replace(/\./g, "")
        .replace(/\(조\)/g, "")
        .replace(/\(중\)/g, "")
        .replace(/\(석\)/g, "");
}

function parseMeal(text) {
    var mode = 0;
    var oneLineB = true, oneLineL = true, oneLineD = true;
    var texts = text.split("\n");
    for (var i = 0; i < texts.length; i++) {
        switch (texts[i]) {
            case "[조식]":
                mode = 0;
                mealBStr = "아침: ";
                continue;
            case "[중식]":
                mode = 1;
                mealLStr = "점심: ";
                continue;
            case "[석식]":
                mode = 2;
                mealDStr = "저녁: ";
                continue;
        }
        switch (mode) {
            case 0:
                if (mealBStr.length >= 25 && oneLineB) {
                    mealBStr += texts[i] + ",\n";
                    oneLineB = false;
                } else
                    mealBStr += texts[i] + ", ";
                break;
            case 1:
                if (mealLStr.length >= 25 && oneLineL) {
                    mealLStr += texts[i] + ",\n";
                    oneLineL = false;
                } else
                    mealLStr += texts[i] + ", ";
                break;
            case 2:
                if (mealDStr.length >= 30 && oneLineD) {
                    mealDStr += texts[i] + ",\n";
                    oneLineD = false;
                } else
                    mealDStr += texts[i] + ", ";
                break;
        }
    }
}
