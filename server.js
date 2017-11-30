console.log("Node.js is working");

var $ = require('jquery');
var http = require('http');

	//Init des WebServers
const express = require("express");
const app = express();

	//Init BodyParser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

	//EJS Template Engine init
app.engine(".ejs", require("ejs").__express);
app.set("view engine", "ejs");


	//WebServer start
	//Start: http://localhost:3000

app.listen(3000, function() {
	console.log("listening on 3000");
});


// -------------------->>

//tingodb setup
const DB_COLLECTION = 'users';
const Db = require('tingodb')().Db;
const db = new Db(__dirname + '/tingodb', {});
const ObjectId = require('tingodb')().ObjectID;

//Preset DB
const PRESET_COLLECTION = 'presets';
const presetdb = new Db(__dirname + '/tingodb', {});
const presetId = require('tingodb')().ObjectID;

//session setup
const session = require('express-session');
app.use(session({
    secret: 'this-is-a-secret',     //necessary for encoding
    resave: false,                  //should be set to false, except store needs it
    saveUninitialized: false        //same reason as above.
}));

//password hash, for encoding the pw
const passwordHash = require('password-hash');


//either go to the landing page (user not logged in) or go to the content page (user logged in)
app.get('/', (request, response) => {
    if (request.session.authenticated) {
		response.render('Wurfel', {'rolls': 1, 'sides': 6, 'dice': 1});
       // response.sendFile(__dirname + '/Wurfel.html');
    } else {
        response.sendFile(__dirname + '/Login.html');
    }   
});

//create a new user in here (task 1)
//check if the user already exists before creating him (task 3)
//encrypt the password (task 4)
app.post('/registrierung', (request, response) => {
    const username = request.body.loginre;
    const password = request.body.pwre;
    const email = request.body.emailre;

    let errors = [];
    if (username == "" || username == undefined) {
        errors.push('Bitte einen Username eingeben.');
    } 
    if (password == "" || password == undefined) {
        errors.push('Bitte ein Passwort eingeben.');
    } 
    if (email == "" || email == undefined) {
        errors.push('Bitte eine Email angeben.');
    } 
    

    db.collection(DB_COLLECTION).findOne({'username': username}, (error, result) => {
        if (result != null) {
            errors.push('User existiert bereits.');
            response.render('errors', {'error': errors});
        } else {
            if (errors.length == 0) {
                const encryptedPassword = passwordHash.generate(password);

                const newUser = {
                    'username': username,
                    'password': encryptedPassword
                }
    
                db.collection(DB_COLLECTION).save(newUser, (error, result) => {
                    if (error) return console.log(error);
                    console.log('user added to database');
                    console.log('Registrieung war erfolgreich.')
                    response.redirect('/');
                });
            } else {
                response.render('errors', {'error': errors});
            }
        } 
    });
});

//log the user into his account (task 2)
//make him login via sessions (task 5)
app.post('/Wurfel', (request, response) => {
   const username = request.body.username;
   const password = request.body.password;

   let errors = [];

   db.collection(DB_COLLECTION).findOne({'username': username}, (error, result) => {
        if (error) return console.log(error);

        if (result == null) {
            errors.push('Der User ' + username + ' existiert nicht.');
            response.render('errors', {'error': errors});
            return;
        } else {
            if (passwordHash.verify(password, result.password)) {
                request.session.authenticated = true;
                request.session.username = username;
                response.redirect('/');
            } else {
                errors.push('Das Passwort für diesen User stimmt nicht überein.');
                response.render('errors', {'error': errors});
            }
        }
   });
});

//log the user out again and delete his session, redirect to main page
app.get('/logout', (request, response) => {
    delete request.session.authenticated;
    delete request.session.username;
    response.redirect('/');
}); 


app.get('/zurueck', (request, response) => {
    response.redirect('/');
});


app.post('/savePreset', (request, response) => {
	const rolls = request.body.anzwurfel;
	const sides = request.body.pass;
    const dice = request.body.anzwurfe;

	const newPreset = {
		'username': request.session.username,
		'rolls': rolls,
		'sides': sides,
        'dice': dice,
	}

	presetdb.collection(PRESET_COLLECTION).save(newPreset, (error, result) => {
		if (error) return console.log(error);
        console.log('preset added to database');
		response.redirect('/');
	});
});

app.post('/loadPreset', (request, response) => {
	const username = request.session.username;
	const userPresets = [];
	presetdb.collection(PRESET_COLLECTION).find().toArray( (error, result) => {
		if (error) return console.log(error);
		for (let i = 0; i < result.length; i++) {
			if (result[i].username == username) {
                userPresets.push(result[i]);
			}
		}
		response.render('presets', {'userPresets': userPresets});
	});
});
/*
app.post('/loadFromArray',(request, response) => {
	const username = request.session.username;
	const userPresets = [];
	presetdb.collection(PRESET_COLLECTION).find().toArray( (error, result) => {
		if (error) return console.log(error);
		for (let i = 0; i < result.length; i++) {
			if ((result[i].username == username)&&(result[i]._id == )) {
                userPresets.push(result[i]);
			}
		}
   // const request.body.anzwurfel = ;
//	const request.body.pass = ;
  // const request.body.anzwurfe = ;
});
*/

/*
app.post('/loadPreset/:rolls :sides :dice :SavedPresetID', (request, response) => {
	const rollsID = request.params.rolls;
	const sidesID = request.params.sides;
	const diceID = request.params.dice;
    const o_id = new ObjectID(id);
    });
*/
