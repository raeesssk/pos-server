var ObjectId = (require('mongoose').Types.ObjectId);
var AccessToken = require('../db/models/accessTokens');
var formidable = require("formidable");
var async = require('async');
var fs1 = require('fs');
var mkdirp = require('mkdirp');
var fs   = require('fs-extra');
var spawn = require('child_process').spawn;


var Application = require('../db/models/apps');

var model = module.exports;

var application;

var uploadFile = function (file) {

    var temp_path = file.path;
    /* The file name of the uploaded file */
    var file_name = file.name;
    /* Location where we want to copy the uploaded file */
    var new_location = process.cwd() + "/file/application/"+application.application_name+"/";

    fs.copy(temp_path, new_location + file_name, function(err) {
        if (err) {
            console.error("Error is = "+err);
        } else {
            console.log("success!")
        }
    });
};

model.getBaseUrl = function(request) {
    return request.protocol + '://' + request.get('host');
}

model.toObjectId = function() {

    return new ObjectId(this.toString());
};

model.getUserIdFromRequest = function(request, successCallback, errorCallback) {

    var accessToken =  request.headers["authorization"].split(" ")[1];

    AccessToken.findOne({ accessToken: accessToken }, function(error, accessTokenObject)
    {
        if(error)
           return errorCallback(error);

        return successCallback(accessTokenObject.userId);
    });

};

model.upload = function (request, response, next, screen) {

    var form = new formidable.IncomingForm();
    var updatedApplicationObject = {};

    form.on("fileBegin", function (name, file) {

        async.series([
            function(callback) {
                Application.findById(request.params.id, function(error, app)
                {
                    if (error) return callback(error);

                    application = app;
                    callback();
                });
            },
            function(callback) {
                if (!fs1.existsSync("./file/application/" + application.application_name)) {

                    callback();
                }
                else {
                    uploadFile(file);
                    file.path = process.cwd() + "/file/application/" + application.application_name + "/" + file.name;
                    if(screen == 1)
                        updatedApplicationObject["app_screen_1"] = file.path;
                    else if(screen == 2)
                        updatedApplicationObject["app_screen_2"] = file.path;
                    else if(screen == 3)
                        updatedApplicationObject["app_screen_3"] = file.path;
                    else if(screen == 4)
                        updatedApplicationObject["app_screen_4"] = file.path;
                    else if(screen == 5)
                        updatedApplicationObject["app_screen_5"] = file.path;
                    else if(screen == 6)
                        updatedApplicationObject["app_advertisement_banner"] = file.path;
                    else if(screen == 7)
                        updatedApplicationObject["app_thumbnail"] = file.path;
                    else if(screen == 8)
                        updatedApplicationObject["app_icon"] = file.path;
                }
            },
            function(callback) {
                mkdirp("./file/application/" + application.application_name, function (error) {
                    if (error)
                        return callback(error);
                    else {

                        uploadFile(file);
                        file.path = process.cwd() + "/file/application/"+application.application_name+"/" + file.name;
                        if(screen == 1)
                            updatedApplicationObject["app_screen_1"] = file.path;
                        else if(screen == 2)
                            updatedApplicationObject["app_screen_2"] = file.path;
                        else if(screen == 3)
                            updatedApplicationObject["app_screen_3"] = file.path;
                        else if(screen == 4)
                            updatedApplicationObject["app_screen_4"] = file.path;
                        else if(screen == 5)
                            updatedApplicationObject["app_screen_5"] = file.path;
                        else if(screen == 6)
                            updatedApplicationObject["app_advertisement_banner"] = file.path;
                        else if(screen == 7)
                            updatedApplicationObject["app_thumbnail"] = file.path;
                        else if(screen == 8)
                            updatedApplicationObject["app_icon"] = file.path;
                    }
                });
            }
        ]);
    });

    form.on('error', function(error) {
        next(error);
    });

    form.parse(request, function(error, fields, files) {
        updatedApplicationObject["modified"] = new Date;
        //Update Application
        Application.findByIdAndUpdate(request.params.id, updatedApplicationObject, {new: true}, function(error, updatedApplication)
        {
            if (error)
                next(error);

            else
            {
                response.status(200)
                    .header("Content-Type","text/json")
                    .send(updatedApplication);
            }
        });
    });
};

model.cmd_exec = function (cmd, args, cb_stdout, cb_end) {

  var child = spawn(cmd, args);
  var me = this;

  me.exit = 0;  // Send a cb to set 1 when cmd exits
  
  child.stdout.on('data', function (data) { cb_stdout(me, data) });
  child.stdout.on('end', function () { cb_end(me) });
}