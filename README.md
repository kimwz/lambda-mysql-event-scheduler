## AWS Lambda mysql event scheduler

AWS Aurora Serverless does not support event scheduler.
This is alternative script.

This script requires permissions to access to information_schema, to create a database, to create table.
#### Process
(Once) Create a database and a table to manage scheduler (lambada_scheduler.events)

1. Sync data from `information_schema.events` to `lambda_scheduler.events` every each time
2. Run reserved events
3. Update a field last_executed

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
