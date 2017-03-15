# Configs

#### Gmail Account

    * __email:__ architecture.ddpt@gmail.com
    * __password:__ architecture2016portolisboa
    * __Client Key:__  58834564768-9oustj3ks9bgak9dbvctirbefljjv00t.apps.googleusercontent.com
    * __Secret Key:__ yGw53051kZMY3MP87F4khaoZ

    How to manage developer account:

    * Access Google developers console (https://console.developers.google.com/project)
    * Access "Architecture Project"
    * Access API Management (https://console.developers.google.com/apis/library?project=architecture-project)
    * Credentials -> Auth Project

        Autorized javascript sources :
        - http://localhost:9001
        - http://localhost:9004
        - https://localhost:9014
        - https://localhost:9011

        Authorized callbacks:
        - http://localhost:9001/auth/google/callback
        - https://localhost:9011/auth/google/callback
        - http://localhost:9004/login/google/callback
        - https://localhost:9014/login/google/callback
        - http://localhost:9004/account/settings/google/callback
        - https://localhost:9014/account/settings/google/callback



#### Facebook account

    * __email:__ architecture.ddpt@gmail.com
    * __password:__ architecture2016portolisboa
    * __app id:__ 808088292630875
    * __app secret:__ 9f88d5503dd32e2068cc9df54e8d8cd8

    How to manage developer account:
    * Access Facebook Developer console (https://developers.facebook.com/apps/808088292630875/dashboard/)
    * Settings -> Advanced -> Client OAuth Settings

    Authorized callbacks:
    - http://localhost:9001/auth/facebook/callback
    - https://localhost:9011/auth/facebook/callback
    - http://localhost:9004/login/facebook/callback
    - https://localhost:9014/login/facebook/callback
    - http://localhost:9004/account/settings/facebook/callback
    - https://localhost:9014/account/settings/facebook/callback


    * App Review
       -> "Do you want to make this app and all its live features available to the general public?" YES

#### LinkedIn account

    * __email:__ architecture.ddpt@gmail.com
    * __password:__ architecture2016portolisboa
    * __app id:__ 77yos1qwnjlzl4
    * __app secret:__ ur0gke5rWE67txSs

    How to manage developer account:
    * Access LinkedIn developer console (https://www.linkedin.com/developer/apps)
    * Open ArchitectureDDPT application

    Authorized callbacks:
    - http://localhost:9001/auth/linkedin/callback
    - https://localhost:9011/auth/linkedin/callback
    - http://localhost:9004/login/linkedin/callback
    - https://localhost:9014/login/linkedin/callback
    - http://localhost:9004/account/settings/linkedin/callback
    - https://localhost:9014/account/settings/linkedin/callback

#### Active Directory

    * __url:__ 'ldap://192.168.12.106:389'
    * __adminDn:__ 'DigitalAdmin'
    * __adminPassword:__ 'Password1'
    * __searhBase:__ 'CN=Users,DC=ad,DC=fitlab,DC=deloitte,DC=pt'
    * __usernameField:__ sAMAccountName (userPrincipalName)
    * __passwordField:__ unicodePwd
    * __searchFilter:__ '|(sAMAccountName={{username}})(userPrincipalName={{username}})'

                (according to https://msdn.microsoft.com/en-us/library/windows/desktop/ms677943(v=vs.85).aspx
                and according to https://msdn.microsoft.com/en-us/library/windows/desktop/ms677605(v=vs.85).aspx)

    Test Credentials:
        fisousa@ad.fitlab.deloitte.pt
        Password1


according to https://msdn.microsoft.com/en-us/library/windows/desktop/ms677943(v=vs.85).aspx
and according to https://msdn.microsoft.com/en-us/library/windows/desktop/ms677605(v=vs.85).aspx

# Some Changes

## Dependencies
  - Node.js
  - MongoDB
  - SASS (http://sass-lang.com/install)
    * install ruby (http://rubyinstaller.org/)
    * run "gem install sass"
  - Grunt-cli (http://gruntjs.com/getting-started)
    * run "npm install -g grunt-cli"
  - Bower (http://bower.io/#install-bower)
    * run "npm install -g bower"

## run & setup

### setup:
  - run "npm install"
  - run "cd client && bower install && cd ..

#### Only for the first run. It cleans database and creates an admin user
  - run "node init.js"
    * username : admin
    * email : architecture.ddpt@gmail.com
    * password : admin

   - change config.js file in order to follow your own configurations like smtp properties, google, facebook, linkedin and active directory services configurations


#### run:
  - Run a MongoDB instance on port 27017

  - run "grunt"
    Changes in source code are automatically detected, source code is refreshed  (sass files, templates, etc) and restarts application.

  - run "node app.js"
    Runs application in a traditional way.


## bcrypt Installation Trouble

https://github.com/jedireza/drywall/wiki/bcrypt-Installation-Trouble

### Step #1 - Update /package.json

```diff
-  "bcrypt": "~0.7.7"
+  "bcryptjs": "~0.7.12"
```
One occurrence. Version numbers may be different.

### Step #2 - Update ./init.js

```diff
-  var bcrypt = require('bcrypt');
+  var bcrypt = require('bcryptjs');
```

### Step #3 - Update /schema/User.js

```diff
-  var bcrypt = require('bcrypt');
+  var bcrypt = require('bcryptjs');
```
Two Ocurrences, inside encryptPassword and validatePassword methods.

## More References

* Drywall Repository: https://github.com/jedireza/drywall
* Drywall Wiki: https://github.com/jedireza/drywall/wiki
* Angular Drywall : https://github.com/arthurkao/angular-drywall
