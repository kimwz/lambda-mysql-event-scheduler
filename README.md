## AWS Lambda mysql event scheduler

AWS Aurora Serverless does not support event scheduler.
This is alternative script.

This script requires permissions to access to information_schema, to create a database, to create table.

#### Test event scheduler
```
app$ npm install
app$ ./lambda-local.js -f index -e '{"host":"", "username":"", "password": "", "port":3306, "database":""}' 
```

#### Deploy to Lambda
1. update Gruntfile.js

2. build and deploy to Lambda
```
$ npm install
$ grunt production
```

#### Setup Trigger (CloudWatch Event)
- period 1 minute  
