'use strict';
var service = {
    /*
        Start workflow to send an email to the system.
        It validates if all data was received like name, email and message and after it send an email to the system email
    */
    sendMessage: function(req, res){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `send message`, message : `Starting send message workflow.`});

        //must receive an email, password and name
        workflow.on('validate', function() {
            if (!req.body.name) {
                workflow.outcome.errfor.name = 'required';
            }

            if (!req.body.email) {
                workflow.outcome.errfor.email = 'required';
            }

            if (!req.body.message) {
                workflow.outcome.errfor.message = 'required';
            }

            if (workflow.hasErrors()) {
                logClient.Log({ level:"ERROR", category : `send message`, message : `Invalid message data. ${workflow.outcome.errfor}`});
                return workflow.emit('response');
            }

            workflow.emit('sendEmail');
        });
        //it sends email to the system email
        workflow.on('sendEmail', function() {
            logClient.Log({ level:"DEBUG", category : `send message`, message : `Sending email`});

            req.app.utility.sendmail(req, res, {
                from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
                replyTo: req.body.email,
                to: req.app.config.systemEmail,
                subject: req.app.config.projectName +' contact form',
                textPath: 'contact/email-text',
                htmlPath: 'contact/email-html',
                locals: {
                    name: req.body.name,
                    email: req.body.email,
                    message: req.body.message,
                    projectName: req.app.config.projectName
                },
                success: function(message) {
                    logClient.Log({ level:"INFO", category : `send message`, message : `Email sent successfuly`});
                    workflow.emit('response');
                },
                error: function(err) {
                    logClient.Log({ level:"ERROR", category : `send message`, message : `Error sending email. ${err.message}`});
                    workflow.outcome.errors.push('Error Sending: '+ err);
                    workflow.emit('response');
                }
            });
        });

        workflow.emit('validate');
    }
};
module.exports = service;
