For the RabbitMQ server is necessary to:
- Download the installer from: https://www.rabbitmq.com/download.html
- Install and Start the rabbit Server
    - RabbitMQ service will be available at amqp://localhost:5672
- Enable RabbitMQ Management GUI:
    - Run "rabbitmq-plugins enable rabbitmq_management"
    - Access it through http://localhost:15672/
- Add Users:
    - GUI:
        - Tab Admin -> Add User
    - Command Line Interface:
        - Access path C:\Program Files (x86)\RabbitMQ Server\rabbitmq_server-3.5.7\sbin
        - Run "rabbitmqctl add_user [name] [password]""
        - Run "rabbitmqctl set_user_tags [name] [administrator]"
        - Run "rabbitmqctl set_permissions -p / [name] ".*" ".*" ".*" "

Run an instance of MongoDB to be used by LogServer and run it

For FalcorRouter
    - Access LogClient/config.js
    - Change rabbitConfigs in order to achieve RabbitMQ service instance
    - run "node index.js"

To use BrowserClient in frontend server
  - Include logclientConfig.js
  - Change frontend server in order to serve an ejs:
    - Run "npm install ejs --save --save-exact"
          app.set('view engine', 'ejs');

          app.get('/', function(req, res){
            res.render('index', {configurations: logClientConfig});
          });
  - Create a folder "views", rename index.html to index.ejs and move it to the
    created folder.
  - Update index.ejs file in order to use configurations
    - Add the following scripts
      <script src="falcor.browser.js"></script>
      <script src="LogClient.js"></script>
      <script>
        var configurations = <%- JSON.stringify(configurations) %>
      </script>
  - Now it is possible to use LogClient
      - var logClient = new LogClient;
      - logClient.SendLog(logDebug);


For the LogServer that receives the messages and saves to MongoDB:
- Go to the LogServer folder and type: npm install
- Change config.js in order to achieve MongoDB and RabbitMQ service
- Just run "node index.js"


For test project
- Change config.js in order to achieve all servers: MongoDB, FalcorRouter, etc.
