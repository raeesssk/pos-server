var Mailgun = require('mailgun-js');
var UUID = require('node-uuid');

var Constants = require('./constants');
var Helper = require('./helpers');

var Crypt = require('../commons/encryption');
var EmailVerification = require('../db/models/emailVerification');


var model = module.exports;


var sendEmail = function(to, subject, html, successCallback, errorCallback) {

    var mailgun = new Mailgun({apiKey: Constants.MAILGUN_API_KEY, domain: Constants.MAILGUN_DOMAIN});

    var data = {
        from: Constants.MAILGUN_FROM_ADDRESS,
        to: to,
        subject: subject,
        html: html
    }

    //Sending the email
    mailgun.messages().send(data, function (error, body) {

        if (error) {
            errorCallback(error);
        }
        else {
            successCallback(body);
        }
    });
};


model.sendVerificationEmail = function(request, user, successCallback, errorCallback) {

    // Create New Verification entry
    var verificationEntry = new EmailVerification({
        verification_token: UUID.v4(),
        user: user._id
    });

    verificationEntry.save(function (error, newEntry) {

        if(error)
            errorCallback(error);

        // Create email to send
        var to = user.fullName  + "<" + user.email + ">";
        var subject = "Email Verification";
        var html = "Hello " + user.fullName + "<br><br>";
        html = html + "Please Verify your email address by clicking below<br><br>";
        html = html + "<a href=" + Helper.getBaseUrl(request) + "/emailVerification.html?token=" + newEntry.verification_token + "&email=" + user.email + ">Click Here to verify</a>";
        html = html + "<br><br>"
        html = html + "Thank you<br>"
        html = html + "Test Gizmo Geeks";

        // Call Send Email
        sendEmail(to, subject, html, function(body)
        {
            successCallback();
        },
        function(error)
        {
            errorCallback(error);
        });
    });
};


model.sendDownloadEmail = function(request, user, application, successCallback, errorCallback) {

    var id = Crypt.encrypt(request.params.id);
    // Create email to send
    var to = "<" + user + ">";
    var subject = "Download Url for " + application.application_name;
    var html = "Hello User<br><br>";
    html = html + "Please download the app using the below url :<br><br>";
    html = html + "<a href=" + Helper.getBaseUrl(request) + "/apps/" + id + "/download>Click Here to Download</a>";
    html = html + "<br><br>"
    html = html + "Thank you<br>"
    html = html + "Test Gizmo Geeks";

    // Call Send Email
    sendEmail(to, subject, html, function(body)
    {
        successCallback();
    },
    function(error)
    {
        errorCallback(error);
    });
};

model.sendUserInviteEmail = function(request, useremail, application, successCallback, errorCallback) {

    var id = Crypt.encrypt(request.params.id);
    // Create email to send
    var to = "<" + useremail + ">";
    var subject = "Invitation to use Test Gizmo";
    var html = "Hello User<br><br>";
    html = html + "You have been invited to use Test Gizmo<br><br>";
    html = html + "<a href=" + Helper.getBaseUrl(request) + "/users/signup>Click Here to Sign Up</a>";
    html = html + "<br><br>"
    html = html + "Thank you<br>"
    html = html + "Test Gizmo Geeks";

    // Call Send Email
    sendEmail(to, subject, html, function(body)
        {
            successCallback();
        },
        function(error)
        {
            errorCallback(error);
        });
};
