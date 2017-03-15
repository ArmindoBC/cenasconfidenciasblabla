var fs = require('fs');
var timestamp = new Date().toISOString();
var date = new Date(timestamp);

exports.testCounter = 0;
exports.successTests = 0;
var fileName = undefined;

var CreateFileName = function(){
    var day =  1;
    //date.getDate();
    if (day.toString().length == 1){
        day = '0'+day;
    }
    var month = date.getMonth()+1;
    if (month.toString().length == 1){
        month = '0'+month;
    }
    var year = date.getFullYear();
    var fullDate = `${day}-${month}-${year}`;
    var hour = date.getHours();
    if (hour.toString().length == 1){
        hour = '0'+hour;
    }
    var minutes = date.getMinutes();
    if (minutes.toString().length == 1){
        minutes = '0'+minutes;
    }
    var fullHour = `${hour}-${minutes}`;
    return 'backend_testing_'+fullDate+'_'+fullHour;
};

exports.CreateLogsFile = function(){
    var dirName = 'Logs';
    fileName = CreateFileName();
    if (!fs.existsSync(dirName)){
        fs.mkdirSync(dirName);
    }
    var createStream = fs.createWriteStream(`./${dirName}/${fileName}.txt`);
    createStream.end();

    fs.appendFile(`./${dirName}/${fileName}.txt`, '-----' + date + '-----' + '\n' , function(err) {
        if(err) {
            return console.log(err);
        }
    });
};

exports.PrintDetailedResult = function(result){

    console.log(`${result.id} - ${result.title} ... ${result.description} ... ${result.result}`);
    if(result.result === 'PASSED' ){
        exports.successTests++;
    }
    fs.appendFile("./Logs/" + fileName + ".txt", JSON.stringify(result,null, 4) + '\n' , function(err) {
        if(err) {
            return console.log(err);
        }

    });
};
