# ViewFinderAPI

the url for the backend is: https://jz5n3jxz3k.execute-api.us-east-2.amazonaws.com/apiV2

It is an API gateway that directs traffic to an AWS Lambda. The Lambda uses DynamoDB to as the database

## References

I used AWS documentation mostly with the following two being the most essential on [basic CRUD API with Lambda/DynamoDB](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-dynamo-db.html) and ensuring the [AWS account is configured correctly](https://docs.aws.amazon.com/IAM/latest/UserGuide/getting-set-up.html)



## Table Schema

The partition key is the combination of the primary and sort keys. The primary key is userID and the sort key is titleID. Data is stored as a container of Items such as

```
{
  ...
  partitionKey: {
    "userID": "test@gmail.com",
    "titleID": "tt6334354",
    "title": "Suicide Squad",
    "rating": 7.2,
    "recommendations": 0,
    "watched": false,
    "rejected": false
  }
  ...
}
```

example queries 

```
get all movies by a userID

{
  "routeKey": "GET /user/{userID}",
  "pathParameters": {
    "userID": "test@gmail.com"
  }
}

```

add a movie to a userID. if it already exists it increments recommendations

```
{
  "routeKey": "PUT /user/{userID}/{titleID}",
  "pathParameters": {
    "userID": "test@gmail.com",
    "titleID": "tt6334354"
  },
  "body": {
    "title": "Suicide Squad",
    "rating": 7.2,
    "recommendations": 0,
    "watched": false,
    "rejected": false
  }
}
```

delete an item in the table

```
{
  "routeKey": "DELETE /user/{userID}/{titleID}",
  "pathParameters": {
    "userID": "test2@gmail.com",
    "titleID": "tt6334354"
  }
}
```
