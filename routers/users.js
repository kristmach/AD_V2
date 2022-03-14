//AnotherMe:password,Me:MyPass,Radu:password,Jyri:1234,Petri:p3tri
const db = require("../db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = require("express").Router();

const handleError = (err, response, code=404) => {
    response.status(code).json(err);
};

// not used in web app
router.get("/", (request, response) => {
    db.getAllUsers(
        (err) => {
            handleError(err, response);
        },
        (users) => {
            response.json(users);
        }
    );
});

// not used in web app
router.get("/:id", (request, response) => {
    const id = request.params.id;
    if(!Number.isInteger(Number(id))){
        response.status(400);
        response.json({ error: "invalid user id " + id });
        return;
    }
    db.getUser(
        id,
        (err) => {
            handleError(err, response);
        },
        (users) => {
            if (users.length == 0) {
                response.status(404);
                response.json({ error: "no user with id " + id });
            } else {
                response.json(users[0]);
            }
        }
    );
});

router.post("/", async (request, response) => {
    if(!request.body.password || !request.body.name){
        handleError({ err: "Missing user or password" }, response,400);
        return;
    }
    request.body.password = await bcrypt.hash(request.body.password, 10);

    db.addUser(
        request.body,
        (err) => {
            handleError(err, response);
        },
        (status) => {
            db.getUser(
                status.insertId,
                (err) => {
                    handleError(err, response);
                },
                (resultArray) => {
                    const token = jwt.sign(
                        {
                            username: resultArray[0]["Name"],
                            id: resultArray[0]["ID"],
                        },
                        process.env.SECRET
                    );
                    delete resultArray[0]["Password"];
                    resultArray[0]["Token"] = token;
                    response.json(resultArray[0]);
                }
            );
        }
    );
});

module.exports = router;
