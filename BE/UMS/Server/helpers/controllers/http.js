'use strict';
// public api
var http = {
    /*
        Custom error handler
        It caughts untreated errors of request handlers
    */
  http500: function(err, req, res, next){
    res.status(500);

    var data = { err: {} };
    if (req.app.get('env') === 'development') {
      data.err = err;
      console.log(err.stack);
    }
    req.app.utility.logClient.Log({ level:"ERROR", category : `http 500`, message : `Something went wrong. Details: ${data}`});
    res.send({ error: 'Something went wrong.', details: data });
  }
};
module.exports = http;
