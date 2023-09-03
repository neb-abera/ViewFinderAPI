import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "http-crud-movie-users-recommendations";

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    switch (event.routeKey) {
      case "GET /users":
        body = await dynamo.send(
          new ScanCommand({
            TableName: tableName
          })
        );
        body = body.Items;
        break;
      case "GET /users/getUser/{userID}":
        body = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              userID: event.pathParameters.userID
            },
          })
        );
        body = body.Item;
        break;
      case "PUT /users/addUser/{userID}":
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              "userID": event.pathParameters.userID,
              "movies": {},
            },
          })
        );
        body = `Added user ${event.pathParameters.userID}`;
        break;
      case "DELETE /users/removeUser/{userID}":
        await dynamo.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              "userID": event.pathParameters.userID
            },
          })
        );
        body = `Deleted user ${event.pathParameters.userID}`;
        break;
      case "PUT /users/addMovie/{userID}":
        let addMovieJSON = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        
        var userID = event.pathParameters.userID;
        var titleID = addMovieJSON.titleID;
      
        try {
          await dynamo.send(
            new UpdateCommand({
              TableName: tableName,
              Key: { "userID": userID },
              UpdateExpression: "ADD movies.#titleID.recommendations :increment",
              ConditionExpression: "attribute_exists(movies.#titleID)",
              ExpressionAttributeNames: {
                "#titleID": titleID,
              },
              ExpressionAttributeValues: {
                ":increment": 1,
              },
              ReturnValues: "ALL_NEW",
            })
          );
      
          body = `Incremented recommendations for ${titleID} in ${userID}`;
        } catch (error) {
          if (error.name === "ConditionalCheckFailedException") {
            await dynamo.send(
              new UpdateCommand({
                TableName: tableName,
                Key: { "userID": userID },
                UpdateExpression: "SET movies.#titleID = :details",
                ExpressionAttributeNames: {
                  "#titleID": titleID,
                },
                ExpressionAttributeValues: {
                  ":details": addMovieJSON,
                },
                ReturnValues: "ALL_NEW",
              })
            );
      
            body = `Added movie to ${userID}`;
          }
        }
        break;
      case "DELETE /users/deleteMovie/{userID}":
        let deleteMovieJSON = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        var userID = event.pathParameters.userID;
        var titleID = deleteMovieJSON.titleID;

        await dynamo.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { "userID": userID },
            UpdateExpression: "REMOVE movies.#titleID",
            ExpressionAttributeNames: {
              "#titleID": titleID
            },
            ReturnValues: "ALL_NEW"
          })
        );
        body = `Deleted movie #${titleID} with type ${typeof titleID === 'string'} from ${userID} with type ${typeof userID === 'string'}`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }
  

  return {
    statusCode,
    body,
    headers,
  };
};
