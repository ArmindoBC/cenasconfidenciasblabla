exports.mongoConfigsUMS = {
    host: 'localhost',
    port: 27017,
    database: 'angular-drywall'
};

exports.FrontEndConfigs = {
    host: 'localhost',
    port: 9001
};
exports.BackEndConfigs = {
    host: 'localhost',
    port: 9003,
    paths: {
        signUp : '/auth/signup/',
        login : '/auth/login/',
        logout : '/auth/logout/',
        authorize : '/auth/authorize/',
        currentUser : '/auth/current-user/'
    }
};
exports.MiddlewareConfigs = {
    host: 'localhost',
    port: 9002,
};

exports.UMSServerConfigs = {
    host: 'localhost',
    port: 9004,
    paths: {
        signUp : '/api/signup/',
        login : '/api/login',
        logout : '/api/logout',
        authorize : '/api/authorize',
        currentUser : '/api/current-user'
    }
};

/*
    Preconditions:
        - newlocalAccount: email and password shouldn't exist on system
        - existingEmail: email must be already registered on system
*/
exports.testingDataBackend = {
    newlocalAccount: {
        username : 'testusername1',
        email: 'fisousa@deloitte.pt',
        password : 'Password1'
    },
    existingAccount:{
        username: 'admin',
        email : 'architecture.ddpt@gmail.com',
        password : 'admin'
    }

}

/*
    Preconditions:
        - newlocalAccount: email and password shouldn't exist on system
        - existingEmail: email must be already registered on system
*/
exports.testingDataUMS = {
    newlocalAccount: {
        username : 'testusername2',
        email: 'fpsousa91@gmail.com',
        password : 'Password1'
    },
    existingAccount:{
        username: 'admin',
        email : 'architecture.ddpt@gmail.com',
        password : 'admin'
    }

}
