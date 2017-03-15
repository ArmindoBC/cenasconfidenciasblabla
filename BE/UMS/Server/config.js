'use strict';

/*
    Server setup configurations
*/
exports.httpMode = true;
exports.httpsMode = true;
exports.httpsModeKeyPath = "./cert/key.pem";
exports.httpsModeCertPath = "./cert/cert.pem";
exports.hostname = 'localhost';
exports.httpPort = 9004;
exports.httpsPort = 9014;
exports.port = exports.httpsMode ? exports.httpsPort : exports.httpPort;
exports.serverAddress = (exports.httpsMode ? "https://" : "http://") + exports.hostname + ':' + exports.port;


/*
    MongoDB configurations
*/
exports.mongodb = {
  uri: 'mongodb://localhost:27017/user-management-system'
};


exports.companyName = 'Deloitte Digital';
exports.projectName = 'User Management System';
exports.systemEmail = 'architecture.ddpt@gmail.com';
exports.cryptoKey = 'k3yb0ardc4t';

/*
    Number of allowed login attempts in the indicated period of time
*/
exports.loginAttempts = {
  forIp: 100,
  forIpAndUser: 50,
  logExpiration: '20m'
};

exports.requireAccountVerification = false;
exports.sendWelcomeEmail = false;
/*
    SMTP configurations in order to enable to send emails
*/
exports.smtp = {
  from: {
    name: exports.projectName +' Website',
    address:  'architecture.ddpt@gmail.com'
  },
  credentials: {
    user: 'architecture.ddpt@gmail.com',
    password: 'architecture2016portolisboa',
    host:  'smtp.gmail.com',
    ssl: true
  }
};

/*
    Configurations to access social authentication
*/
exports.oauth = {
  facebook: {
    key:  '808088292630875',
    secret:  '9f88d5503dd32e2068cc9df54e8d8cd8'
  },
  linkedin: {
    key: '77yos1qwnjlzl4',
    secret:  'ur0gke5rWE67txSs'
  },
  google: {
    key:  '58834564768-9oustj3ks9bgak9dbvctirbefljjv00t.apps.googleusercontent.com',
    secret:  'yGw53051kZMY3MP87F4khaoZ'
  }
};

/*
    Access configurations for Active Directory server
*/
exports.LDAPopts = {
    server: {
        url : 'ldap://192.168.12.106:389',
        bindDn: 'CN=Digital Admin,CN=Users,DC=ad,DC=fitlab,DC=deloitte,DC=pt',
        bindCredentials: 'Password1',
        searchBase: 'CN=Users,DC=ad,DC=fitlab,DC=deloitte,DC=pt',
        usernameField: 'sAMAccountName',
        passwordField: 'unicodePwd',
        searchFilter: '|(sAMAccountName={{username}})(userPrincipalName={{username}})'
    }
};

exports.machineName = "development";

/*
    Lifetime for a user session Token.
    Can be used properties like 'year', 'month', 'day', 'hour', 'minute' and 'second'
*/
exports.sessionTokenExpiration = {
    month: 12,
};
