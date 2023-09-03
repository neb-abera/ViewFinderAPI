import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    GetCommand,
    DeleteCommand,
    UpdateCommand,
    QueryCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "http-crud-movie-users-recommendationsV2";

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
            case "GET /user/{userID}":
                body = await dynamo.send(
                    new QueryCommand({
                        TableName: tableName,
                        KeyConditionExpression: "#userID = :userID",
                        ExpressionAttributeNames: {
                            "#userID": "userID",
                        },
                        ExpressionAttributeValues: {
                            ":userID": event.pathParameters.userID,
                        },
                    })
                );
                body = body.Items;
                break;
            case "PUT /user/{userID}/{titleID}":
                let addMovieJSON = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
                try {
                    // Try to update the item
                    await dynamo.send(
                        new UpdateCommand({
                            TableName: tableName,
                            Key: {
                                "userID": event.pathParameters.userID,
                                "titleID": event.pathParameters.titleID,
                            },
                            UpdateExpression: "ADD #recommendations :increment",
                            ExpressionAttributeNames: {
                                "#recommendations": "recommendations",
                            },
                            ExpressionAttributeValues: {
                                ":increment": 1,
                            },
                            ConditionExpression: "attribute_exists(userID)",
                            ReturnValues: "ALL_NEW",
                        })
                    );
                    body = `Incremented recommendations for ${event.pathParameters.titleID} in ${event.pathParameters.userID}`;
                } catch (error) {
                    if (error.name === "ConditionalCheckFailedException") {
                        // Item does not exist, create it
                        await dynamo.send(
                            new PutCommand({
                                TableName: tableName,
                                Item: {
                                    "userID": event.pathParameters.userID,
                                    "titleID": event.pathParameters.titleID,
                                    "rating": addMovieJSON.rating,
                                    "recommendations": 0,
                                    "watched": false,
                                    "rejected": false,
                                },
                            })
                        );
                        body = `Added the movie ${event.pathParameters.titleID} to user ${event.pathParameters.userID}`;
                    } else {
                        throw error;
                    }
                }
                break;
            case "DELETE /user/{userID}/{titleID}":
                await dynamo.send(
                    new DeleteCommand({
                        TableName: tableName,
                        Key: {
                            "userID": event.pathParameters.userID,
                            "titleID": event.pathParameters.titleID,
                        },
                    })
                );
                body = `Deleted movie from user ${event.pathParameters.userID}`;
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
