var path = require('path');
var fs   = require('fs-extra');
var mime = require('mime');

var model = module.exports;

model.getDownloadFile = function(file, response) {

    var filename = path.basename(file);
    var mimetype = mime.lookup(file);

    response.setHeader('Content-disposition', 'attachment; filename=' + filename);
    response.setHeader('Content-type', mimetype);

    var filestream = fs.createReadStream(file);
    filestream.pipe(response);
}

model.getPlistFile = function (downlaodPath, downlaodIcon, application, response) {


    var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        + "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">"
        + "<plist version=\"1.0\">"
        + "<dict>"
        + "<key>items</key>"
        + "<array>"
        + "<dict>"
        + "<key>assets</key>"
        + "<array>"
        + "<dict>"
        + "<key>kind</key>"
        + "<string>software-package</string>"
        + "<key>url</key>"
        + "<string>" + downlaodPath + "</string>"
        + "</dict>"
        + "<dict>"
        + "<key>kind</key>"
        + "<string>display-image</string>"
        + "<key>needs-shine</key>"
        + "<true/>"
        + "<key>url</key>"
        + "<string>" + downlaodIcon + "</string>"
        + "</dict>"
        + "</array>"
        + "<key>metadata</key>"
        + "<dict>"
        + "<key>bundle-identifier</key>"
        + "<string>" + application.bundle_identifier + "</string>"
        + "<key>bundle-version</key>"
        + "<string>" + application.bundleVersion + "</string>"
        + "<key>kind</key>"
        + "<string>software</string>"
        + "<key>title</key>"
        + "<string>" + application.application_name + "</string>"
        + "</dict>"
        + "</dict>"
        + "</array>"
        + "</dict>"
        + "</plist>";

    response.status(200)
        .header("Content-Type","application/xml")
        .send(xml);
}