var model = module.exports;

model.errorCodes = {

    UNEXPECTED_ERROR : 0,
    MISSING_INPUT : 1,
    INVALID_ARGUMENTS : 2,
    ACCESS_DENIED: 3,
    CAPTCHA_ERROR: 4,
    EMAIL_ERROR: 5,
    NOT_FOUND_WITH:6,
    NOT_FOUND_FOR:7,
    EXPIRED_WITH:8,
    EXPIRED_FOR:9,
    OPERATION_FAILED:10
};

model.getErrorMessage = function(errorCode, stringParams, details) {

    var errorMessage;

    switch(errorCode) {

        case 0:     errorMessage = "Unexpected Error";
                     break;

        case 1   :   errorMessage = "Field " + stringParams[0] + " is required for this request";
                     break;

        case 2   :   errorMessage = "Request has missing or invalid arguments";
                     break;

        case 3   :   errorMessage = "Server has denied access to this resource";
                     break;

        case 4   :   errorMessage = "Error in Captcha Validation";
                     break;

        case 5   :   errorMessage = "Error while sending email";
                     break;

        case 6   :   errorMessage = stringParams[0] + " with " + stringParams[1] + " '" + stringParams[2] + "'" + " not found";
                     break;

        case 7   :   errorMessage = stringParams[0] + " for " + stringParams[1] + " '" + stringParams[2] + "'" + " not found";
                     break;

        case 8   :   errorMessage = stringParams[0] + " with " + stringParams[1] + " '" + stringParams[2] + "'" + " has expired";
                     break;

        case 9   :   errorMessage = stringParams[0] + " for " + stringParams[1] + " '" + stringParams[2] + "'" + " has expired";
                     break;

        case 10  :   errorMessage = "Error occurred while " + stringParams[0];
                     break;

    }

    if(details)
        return {code:errorCode, message:errorMessage, details:details};
    else
        return {code:errorCode, message:errorMessage};
};