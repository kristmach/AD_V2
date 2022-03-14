const db = require("../db.js");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const router = require("express").Router();
const {Parser} = require('json2csv');
const json2csv=new Parser();

const handleError = (err, response, code="404") => {
    response.status(code).json(err);
};

const processToken = (request) => {
    const auth = request.get("authorization");
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
        const token = auth.substring(7);
        
        let decodedToken=null;
        try{
            decodedToken = jwt.verify(token, process.env.SECRET);
        }catch(err){
            return {ok:false,info:"incorrect token"};
        }
        
        if (!token) {
            return {ok:false,info:"missing token"};
        }
        if (!decodedToken.id) {
            return {ok:false,info:"incorrect token"};
        }
        return {ok:true,info:decodedToken.id};
    } else {
        return {ok:false,info:"missing token"};
    }
};

/**
 * @swagger
 * /api/places:
 *   get:
 *     summary: Returns a list of all Places
 *     tags: [Places]
 *     operationId: getPlaces
 *     responses:
 *       '200':
 *         description: Successfully returned a list of places
 *         content:
 *           application/json:
 *             schema:
 *               description: List of places
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Place'
 */ 
router.get("/", (request, response) => {
    db.getAllPlaces(
        (err) => {
            handleError(err, response);
        },
        (places) => {
            switch(request.headers.accept){
                case "application/json":
                    response.json(places);
                    break;
                case "text/csv":
                    response.status(200).send(json2csv.parse(places));
                    break;
                default:
                    response.json(places);
                    break;
            }
        }
    );
});

// not used in web app
router.get("/:id", (request, response) => {
    const id = request.params.id;
    if(!Number.isInteger(Number(id))){
        response.status(400);
        response.json({ error: "invalid place id " + id });
        return;
    }
    db.getPlace(
        id,
        (err) => {
            handleError(err, response);
        },
        (places) => {
            if (places.length == 0) {
                response.status(404);
                response.json({ error: "no place with id " + id });
            } else {
                response.json(places[0]);
            }
        }
    );
});

/**
 * @swagger
 * /api/places:
 *   post:
 *     summary: Create a new Place
 *     tags: [Places]
 *     operationId: addPlace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaceToBeAdded'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: The place was created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Place'
 *       '404':
 *         description: Server Error
 */
router.post("/", (request, response) => {
    const res = processToken(request);
    if(!res.ok){
        switch(res.info){
            case "missing token":
                handleError({ err: "Not Authorized" }, response,401);
                break;
            case "incorrect token":
                handleError({ err: "Not Authorized" }, response,403);
                break;
        }
        return;
    }

    // To-Do: remove this when 
    if(!request.body.Latitude){
        request.body.Latitude=request.body.lat;
        request.body.Longitude=request.body.lon;
        request.body.Name=request.body.name;
        request.body.UserId=request.body.userId;
    }

    // things are ok...
    const decodedUserId=res.info;
    if (decodedUserId != request.body.UserId) {
        handleError({ err: "Not Authorized" }, response, 403);
        return;
    }

    db.addPlace(
        request.body,
        (err) => {
            handleError(err, response);
        },
        (status) => {
            db.getPlace(
                status.insertId,
                (err) => {
                    handleError(err, response);
                },
                (places) => {
                    if (places.length == 0) {
                        response.status(404);
                        response.json({ error: "no place with id " + id });
                    } else {
                        response.json(places[0]);
                    }
                }
            );
        }
    );
});

router.delete("/:id", (request, response) => {

    const res = processToken(request);
    if(!res.ok){
        switch(res.info){
            case "missing token":
                handleError({ err: "Not Authorized" }, response,401);
                break;
            case "incorrect token":
                handleError({ err: "Not Authorized" }, response,403);
                break;
        }
        return;
    }

    const id = request.params.id;
    db.getPlace(
        id,
        (err) => {
            handleError(err, response);
        },
        (resultArr) => {
            if (resultArr.length == 0) {
                response.status(404);
                response.json({ error: "no place with id " + id });
                return;
            } else {
                const decodedUserId = res.info;
                if (decodedUserId != resultArr[0].UserID) {
                    handleError({ err: "Not Authorized" }, response,403);
                    return;
                }
                // Callback hell (can be avoided with mariadb Promise API)
                db.deletePlace(
                    id,
                    (err) => {
                        handleError(err, response);
                    },
                    (status) => {
                        response.json({...status,...resultArr[0]});
                    }
                );
            }
        }
    );
});

router.put("/:id", (request, response) => {
    const res = processToken(request);
    if(!res.ok){
        switch(res.info){
            case "missing token":
                handleError({ err: "Not Authorized" }, response,401);
                break;
            case "incorrect token":
                handleError({ err: "Not Authorized" }, response,403);
                break;
        }
        return;
    }

    const id = request.params.id;
    db.getPlace(
        id,
        (err) => {
            handleError(err, response);
        },
        (resultArr) => {
            if (resultArr.length == 0) {
                response.status(404);
                response.json({ error: "no place with id " + id });
                return;
            } else {
                const decodedUserId = res.info;
                if (decodedUserId != resultArr[0].UserID) {
                    handleError({ err: "Not Authorized" }, response,403);
                    return;
                }
                // Callback hell (can be avoided with mariadb Promise API)
                db.updatePlace(
                    id,
                    request.body,
                    (err) => {
                        handleError(err, response);
                    },
                    (status) => {
                        db.getPlace(
                            id,
                            (err) => {
                                handleError(err, response);
                            },
                            (place) => {
                                response.json(place);
                            }
                        );
                    }
                );
            }
        }
    );
});

// not used in web app
router.get("/nearby/:lat/:lon/:dist", (request, response) => {
    const lat = request.params.lat;
    const lon = request.params.lon;
    const dist = request.params.dist; // distance in km

    db.getAllPlaces(
        (err) => {
            handleError(err, response);
        },
        (places) => {
            response.json(getPlacesNearby(places, lat, lon, dist));
        }
    );
});

// not used in web app
// Modified this function from Pia Heinonen
function getPlacesNearby(allPlaces, lat, lon, dist) {
    const lat1 = (lat * Math.PI) / 180;
    const R = 6371;

    // adding distance attribute to each place (GCD)
    var placesWithDistances = allPlaces.map((place) => {
        var lat2 = (place.Latitude * Math.PI) / 180;
        var lonDiff = ((place.Longitude - lon) * Math.PI) / 180;
        var d =
            Math.acos(
                Math.sin(lat1) * Math.sin(lat2) +
                    Math.cos(lat1) * Math.cos(lat2) * Math.cos(lonDiff)
            ) * R;
        place.Distance = d;
        return place;
    });

    //filtering based on dist
    return placesWithDistances.filter((item) => item.Distance <= dist);
}

module.exports = router;
