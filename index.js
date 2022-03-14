const express = require("express");
const cors = require("cors");

const swaggerUi=require('swagger-ui-express');
const swaggerJsDoc=require('swagger-jsdoc');


const yaml=require('yamljs');
//const doc=yaml.load('./pia_get.yml');
const doc=yaml.load('./pia_all.yml');

/*
const fs=require('fs');
const data=fs.readFileSync('./doc.json');
const doc=JSON.parse(data);
*/

const server = express();
server.use(express.static('./client/build')) // react client starts from host url
server.use(cors()); // middleware
server.use(express.json()); // middleware

const placesRouter = require("./routers/places");
server.use("/api/places", placesRouter);

const userRouter = require("./routers/users");
server.use("/api/users", userRouter);

const loginRouter = require("./routers/login");
server.use("/api/login", loginRouter);

server.use("/api/doc",swaggerUi.serve, swaggerUi.setup(doc));

/*
const options={
    definition:{
        openapi:"3.0.0",
        info:{
            title:"Places App API",
            version:"1.0.0",
            description:"Places App API documentation"
        },
        servers:[
            {
                url:"http://localhost:3001"
            }
        ]
    }
    ,
    apis:["./routers/*.js","common.yml"]
};

server.use("/api/doc",swaggerUi.serve, 
    swaggerUi.setup(swaggerJsDoc(options)));
*/
module.exports = server; 