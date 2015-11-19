var CB = require('cloudboost');
var config = require('./config');
var bodyParser = require('body-parser');
var jwt = require('jwt-simple');
var moment = require('moment');
var request = require('request');
var qs = require('querystring');
var express = require('express'),
    app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('www'));

CB.CloudApp.init('fyipeprod', 'Qfq6NfpOF7oFZ18gMI95QA==');

// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.set('port', process.env.PORT || 8100);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function ensureAuthenticated(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
  }
  var token = req.headers.authorization.split(' ')[1];

  var payload = null;
  try {
    payload = jwt.decode(token, config.TOKEN_SECRET);
  }
  catch (err) {
    return res.status(401).send({ message: err.message });
  }

  if (payload.exp <= moment().unix()) {
    return res.status(401).send({ message: 'Token has expired' });
  }
  req.user = payload.sub;
  next();
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createJWT(user_id) {
  var payload = {
    sub: user_id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
}

/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */
app.post('/auth/login', function(req, res) {
  var cbUser = new CB.CloudQuery('User');
  cbUser.equalTo('email', req.body.email);
  cbUser.equalTo('password', req.body.password);
  console.log(JSON.stringify(cbUser));
  cbUser.findOne({
     success: function(user){
         if(!user){
             return res.status(401).send({ message: 'Wrong email and/or password' });
         }
         var token = createJWT(user.get('id'));
         if(user.get('group'))
             return res.send({ token: token, wizard: false,  id: user.get('id'), email: user.get('email'), name: user.get('displayName')  });
         else
           return res.send({ token: token, wizard: true,  id: user.get('id'), email: user.get('email'), name: user.get('displayName')  });
     },
     error: function(err){
         return res.status(500).send({message: 'Server Error'});
     }
  });
});

app.post('/auth/twitter', function(req, res) {
  var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
  var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
  var profileUrl = 'https://api.twitter.com/1.1/users/show.json?screen_name=';
  // Part 1 of 2: Initial request from Satellizer.
  if (!req.body.oauth_token || !req.body.oauth_verifier) {
    var requestTokenOauth = {
      consumer_key: config.TWITTER_KEY,
      consumer_secret: config.TWITTER_SECRET,
      callback: req.body.redirectUri
    };
    // Step 1. Obtain request token for the authorization popup.
    request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function(err, response, body) {
      var oauthToken = qs.parse(body);
      // Step 2. Send OAuth token back to open the authorization screen.
      if(err){
        console.log(err);
      }
      res.send(oauthToken);
    });
  } else {
    // Part 2 of 2: Second request after Authorize app is clicked.
    var accessTokenOauth = {
      consumer_key: config.TWITTER_KEY,
      consumer_secret: config.TWITTER_SECRET,
      token: req.body.oauth_token,
      verifier: req.body.oauth_verifier
    };

    // Step 3. Exchange oauth token and oauth verifier for access token.
    request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, accessToken) {
      accessToken = qs.parse(accessToken);
      var profileOauth = {
        consumer_key: config.TWITTER_KEY,
        consumer_secret: config.TWITTER_SECRET,
        oauth_token: accessToken.oauth_token
      };
      // Step 4. Retrieve profile information about the current user.
      request.get({
        url: profileUrl + accessToken.screen_name,
        oauth: profileOauth,
        json: true
      }, function(err, response, profile) {

        // Step 5a. Link user accounts.
        if (req.headers.authorization) {
          cbQuery = new CB.CloudQuery('User');
          cbQuery.equalTo('twitter', profile.id.toString());
          cbQuery.findOne({
            success: function(obj){
              if(obj){
                return res.status(409).send({ message: 'There is already a Twitter account that belongs to you' });
              }
              var token = req.headers.authorization.split(' ')[1];
              var payload = jwt.decode(token, config.TOKEN_SECRET);
              cbQuery = new CB.CloudQuery('User');
              cbQuery.get(payload.sub,{
                success: function(userObj){
                  if(!userObj){
                    return res.status(400).send({message: 'User not found'});
                  }
                  userObj.set('twitter', profile.id);
                  userObj.set('picture', userObj.get('picture') || profile.profile_image_url.replace('_normal', ''));
                  userObj.set('displayName', userObj.get('displayName') || profile.name);
                  userObj.save({
                    success: function(obj){
                      var token = createJWT(obj.get('id'));
                      res.send({ token: token });
                    }
                  });
                }
              });
            }
          });

        } else {
          // Step 5b. Create a new user account or return an existing one.
          cbQuery = new CB.CloudQuery('User');
          cbQuery.equalTo('twitter', profile.id.toString());
          cbQuery.find({
            success: function(obj){
              if(obj.length > 0){
                var token = createJWT(obj[0].get('id'));
                if(!obj[0].document.group)
                  return res.send({ token: token, wizard: true, id: obj[0].get('id'), email: obj[0].get('email'), name: obj[0].get('displayName')});
  		          return res.send({ token: token, wizard: false,  id: obj[0].get('id'), email: obj[0].get('email'), name: obj[0].get('displayName')  });
          		}
              console.log("user does not exist");
          		cbUser = new CB.CloudUser('User');
              var dummyMail = 'randomemail'+ Math.floor((Math.random() * 1000000) + 1000)+'@gmail.com';
              cbUser.set('email', dummyMail );
              cbUser.set('username', dummyMail);
              cbUser.set('password', '2zBIht@mePh<1Rf');
          		cbUser.set('twitter', (profile.id).toString());
          		cbUser.set('picture', profile.profile_image_url.replace('_normal', ''));
      				cbUser.set('displayName', profile.name);
              cbUser.set('balance', 0);
              cbUser.set('post', 0);
              cbUser.set('sold', 0);
              cbUser.set('closed', 0);
              cbUser.set('bought', 0);
              cbUser.set('accepted', 0);
              cbUser.save({
                success: function(obj){
                  newUserProfile(obj);
                  var token = createJWT(obj.get('id'));
      			      res.send({ token: token, wizard: true,  id: obj.get('id'), email: obj.get('email'), name: obj.get('displayName')  });
                },
                error: function(err){
                  console.log(err);
                  return res.status(400).send({message: 'Twiiter login error'});
                }
              });
            }
          });
        }
      });
    });
  }
});
/*
 |--------------------------------------------------------------------------
 | Login with Google
 |--------------------------------------------------------------------------
 */
app.post('/auth/google', function(req, res) {
  var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
  var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: config.GOOGLE_SECRET,
    redirect_uri: req.body.redirectUri,
    grant_type: 'authorization_code'
  };

  // Step 1. Exchange authorization code for access token.
  request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
    var accessToken = token.access_token;

    var headers = { Authorization: 'Bearer ' + accessToken };

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: peopleApiUrl, headers: { Authorization: 'Bearer ' + accessToken }, json: true }, function(err, response, profile) {
      //adding moment to user profile
      var payload = {
        "type":"http://schemas.google.com/AddActivity",
      };
      payload.object = {
        "id" : "sfdfd",
        "type" : "http://schema.org/CreativeWork",
        "description" : "SignUp Moment",
        "name":"Fyipe SignUp",
        "text": "Fyipe is a cool platfrom to convert your contacts into money"
      };

      // Step 3a. Link user accounts.
      if (req.headers.authorization) {
        cbQuery = new CB.CloudQuery('User');
        cbQuery.equalTo('google', profile.sub);
        cbQuery.findOne({
          success: function(obj){
            if(obj){
              return res.status(409).send({ message: 'There is already a google account that belongs to you' });
            }
            var token = req.headers.authorization.split(' ')[1];
            var payload = jwt.decode(token, config.TOKEN_SECRET);
            cbQuery = new CB.CloudQuery('User');
            cbQuery.get(payload.sub,{
              success: function(userObj){
                if(!userObj){
                  return res.status(400).send({message: 'User not found'});
                }
                userObj.set('google', profile.sub);
                userObj.set('picture', userObj.get('picture') || profile.picture.replace('sz=50', 'sz=200'));
                userObj.set('displayName', userObj.get('displayName') || profile.name);
                userObj.save({
                  success: function(obj){
                    var token = createJWT(obj.get('id'));
                    res.send({ token: token });
                  }
                });
              }
            });
          }
        });
      } else {
        // Step 3b. Create a new user account or return an existing one.
        cbQuery = new CB.CloudQuery('User');
        cbQuery.equalTo('google', profile.sub);
        cbQuery.find({
        	success: function(obj){
        		if(obj.length > 0){
        			var token = createJWT(obj[0].get('id'));
              if(!obj[0].document.group)
                return res.send({ token: token, wizard: true, id: obj[0].get('id'), email: obj[0].get('email'), name: obj[0].get('displayName') });
        			CB.CloudUser.current = obj[0];
		          return res.send({ token: token, wizard: false, id: obj[0].get('id'), email: obj[0].get('email'), name: obj[0].get('displayName')});
        		}

        		console.log("user does not exist");
        		cbUser.set('username', profile.email);
        		cbUser.set('email', profile.email);
        		cbUser.set('password', '2zBIht@mePh<1Rf'); //dummy password
        		cbUser.set('google', profile.sub);
        		cbUser.set('picture', profile.picture.replace('sz=50', 'sz=200'));
    				cbUser.set('displayName', profile.name);
            cbUser.set('balance', 0);
            cbUser.set('post', 0);
            cbUser.set('sold', 0);
            cbUser.set('closed', 0);
            cbUser.set('bought', 0);
            cbUser.set('accepted', 0);
            console.log("creating new user");
    				cbUser.save({
    					success: function(user) {
    						//Registration successfull
                newUserProfile(user);
    						var token = createJWT(user.get('id'));
    			      res.send({ token: token, wizard: true, id: user.get('id'), email: user.get('email'), name: user.get('displayName') });
    					},
    					error: function(err) {
              console.log(err);
    						//Error in user registration.
                var q = new CB.CloudQuery('User');
                q.equalTo('email', profile.email);
                q.findOne({
                  success: function(obj){
                    if(obj){
                      obj.set('google', profile.sub);
                      obj.save({
                        success: function(){
                          //Registration successfull
                          var token = createJWT(obj.get('id'));
                          res.send({ token: token, wizard: false, id: obj.get('id'), email: profile.email, name: profile.name });
                        },
                        error: function(err){
                          console.log(err);
                          return res.status(400).send({message: 'Oops!! somthing went wrong while logging in..'});
                        }
                      });
                    }else {
                      console.log(err);
                      return res.status(400).send({message: 'Oops!! somthing went wrong'});
                    }
                  }
                });
    					}
    				});
        	},
        	error: function(err){
        		console.log(err);
        	}
        });
      }
    });
  });
});

/*
 |--------------------------------------------------------------------------
 | Login with LinkedIn
 |--------------------------------------------------------------------------
 */
app.post('/auth/linkedin', function(req, res) {
  var accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
  var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url)';
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: config.LINKEDIN_SECRET,
    redirect_uri: req.body.redirectUri,
    grant_type: 'authorization_code'
  };

  // Step 1. Exchange authorization code for access token.
  request.post(accessTokenUrl, { form: params, json: true }, function(err, response, body) {
    if (response.statusCode !== 200) {
      return res.status(response.statusCode).send({ message: body.error_description });
    }
    var params = {
      oauth2_access_token: body.access_token,
      format: 'json'
    };

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: peopleApiUrl, qs: params, json: true }, function(err, response, profile) {

      // Step 3a. Link user accounts.
      if (req.headers.authorization) {
        cbQuery = new CB.CloudQuery('User');
        cbQuery.equalTo('linkedin', profile.id);
        cbQuery.findOne({
          success: function(obj){
            if(obj){
              return res.status(409).send({ message: 'There is already a LinkedIn account that belongs to you' });
            }
            var token = req.headers.authorization.split(' ')[1];
            var payload = jwt.decode(token, config.TOKEN_SECRET);
            cbQuery = new CB.CloudQuery('User');
            cbQuery.get(payload.sub,{
              success: function(userObj){
                if(!userObj){
                  return res.status(400).send({message: 'User not found'});
                }
                userObj.set('linkedin', profile.id);
                userObj.set('picture', userObj.get('picture') || profile.pictureUrl);
                userObj.set('displayName', userObj.get('displayName') || profile.firstName + ' ' + profile.lastName);
                userObj.save({
                  success: function(obj){
                    var token = createJWT(obj.get('id'));
                    res.send({ token: token });
                  },
                  error:function(err){
                    console.log(err);
                  }
                });
              }
            });
          }
        });
      } else {
        // Step 3b. Create a new user account or return an existing one.
        cbQuery = new CB.CloudQuery('User');
        cbQuery.equalTo('linkedin', profile.id);
        cbQuery.find({
        	success: function(obj){
        		if(obj.length > 0){
        			var token = createJWT(obj[0].get('id'));
              if(!obj[0].document.group)
                return res.send({ token: token, wizard: true, id: obj[0].get('id'), email: obj[0].get('email'), name: obj[0].get('displayName') });
        			console.log("user exist");
        		  return res.send({ token: token, wizard: false, id: obj[0].get('id'), email: obj[0].get('email'), name: obj[0].get('displayName') });
        		}
        		cbUser = new CB.CloudObject('User');
        		cbUser.set('username', profile.emailAddress);
            if(!profile.emailAddress)
              profile.emailAddress = 'randomemail'+ Math.floor((Math.random() * 1000000) + 1000)+'@gmail.com';
        		cbUser.set('email', profile.emailAddress);
        		cbUser.set('password', '2zBIht@mePh<1Rf'); //dummy password
        		cbUser.set('linkedin', profile.id);
        		cbUser.set('picture', profile.pictureUrl);
    				cbUser.set('displayName', profile.firstName + ' ' + profile.lastName);
            cbUser.set('balance', 0);
            cbUser.set('post', 0);
            cbUser.set('sold', 0);
            cbUser.set('closed', 0);
            cbUser.set('bought', 0);
            cbUser.set('accepted', 0);
    				cbUser.save({
    					success: function(user) {
    						//Registration successfull
                newUserProfile(user);
    						var token = createJWT(user.get('id'));
    			      res.send({ token: token, wizard: true });
    					},
    					error: function(err) {
    						//Error in user registration.
                var q = new CB.CloudQuery('User');
                q.equalTo('email',profile.emailAddress);
                q.findOne({
                  success: function(obj){
                    if(obj){
                      obj.set('linkedin', profile.id);
                      obj.save({
                        success: function(){
                          //Registration successfull
                          var token = createJWT(obj.get('id'));
                          signUpMail(profile.email, profile.name);
                          //getContactList(accessToken);
                          LinkedInPost(params);
                          res.send({ token: token, wizard: false, id: obj.get('id'), email: profile.email, name: profile.name });
                        },
                        error: function(err){
                          console.log(err);
                          return res.status(400).send({message: 'Oops!! somthing went wrong while logging in..'});
                        }
                      });
                    }else {
                      console.log(err);
                      return res.status(400).send({message: 'Oops!! somthing went wrong while logging in..'});
                    }
                  }
                });
    					}
    				});
        	},
        	error: function(err){
            console.log(err);
            return res.status(401).send({message: err});
        	}
        });
      }
    });
  });
});

/*
 |--------------------------------------------------------------------------
 | Login with Facebook
 |--------------------------------------------------------------------------
 */
app.post('/auth/facebook', function(req, res) {

	var cbquery = new CB.CloudQuery("User");
  var accessTokenUrl = 'https://graph.facebook.com/v2.3/oauth/access_token';
  var graphApiUrl = 'https://graph.facebook.com/v2.3/me';

  var params = {
  	code: req.body.code,
  	client_id: req.body.clientId,
  	client_secret: config.FACEBOOK_SECRET,
  	redirect_uri: req.body.redirectUri
  };

  // Step 1. Exchange authorization code for access token.
  request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
    if (response.statusCode !== 200) {
      return res.status(500).send({ message: accessToken.error.message });
    }

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
      if (response.statusCode !== 200) {
        return res.status(500).send({ message: profile.error.message });
      }

      //step 3 login or signup
      if (req.headers.authorization) {
      	cbquery.equalTo('facebook', profile.id);
      	cbquery.find({
      		success: function(obj){
      			if(obj.length > 0){
      				return res.status(409).send({ message: 'There is already a Facebook account that belongs to you' });
      			}
      			var token = req.headers.authorization.split(' ')[1];
          		var payload = jwt.decode(token, config.TOKEN_SECRET);
          		console.log(payload);
          		cbquery.get(payload.sub,{
          			success: function(obj){
          				console.log(obj);
          				if(obj.length <= 0){
          					return res.status(400).send({ message: 'User not found' });
          				}
          				var cbuser = new CB.CloudObject('User');
      						cbuser.set('username', profile.email);
                  if(!profile.email)
                    profile.email = 'randomemail'+ Math.floor((Math.random() * 1000000) + 1000)+'@gmail.com';
      						cbuser.set('email', profile.email);
      						cbuser.set('password', '2zBIht@mePh<1Rf'); //dummy password
      						cbuser.set('facebook', profile.id);
      						cbuser.set('picture','https://graph.facebook.com/' + profile.id + '/picture?type=large');
      						cbuser.set('displayName', profile.name);

      						cbuser.save({
      							success: function(user) {
      								//Registration successfull
      								var token = createJWT(user.get('id'));

      							  res.send({ token: token, wizard: true, id: user.get('id'), email: user.get('email'), name: user.get('displayName') });

      							},
      							error: function(err) {
      								//Error in user registration.
      								console.log(err);
      							}
      						});
          			},
          			error: function(err){
          				console.log(err);
          			}
          		});
      		}
      	});
      } else {
        // Step 3b. Create a new user account or return an existing one.
        cbquery.equalTo('facebook', profile.id);
        cbquery.find({
        	success: function(obj){
        		if(obj.length > 0){

        			var token = createJWT(obj[0].get('id'));
        			console.log(obj[0].get('id'));
              if(!obj[0].document.group)
                return res.send({ token: token, wizard: true, id: obj[0].get('id'), name: obj[0].get('displayName'), email: obj[0].get('email')  });
        			console.log("user exist");
        			CB.CloudUser.current = obj[0];
		          return res.send({ token: token, wizard: false, id: obj[0].get('id'), name: obj[0].get('displayName'), email: obj[0].get('email') });
        		}
        		console.log("user does not exist");
        		var cbuser = new CB.CloudObject('User');
        		cbuser.set('username', profile.email);
        		cbuser.set('email', profile.email);
        		cbuser.set('password', '2zBIht@mePh<1Rf'); //dummy password
        		cbuser.set('facebook', profile.id);
        		cbuser.set('picture','https://graph.facebook.com/' + profile.id + '/picture?type=large');
				    cbuser.set('displayName', profile.name);
            cbuser.set('balance', 0);

            cbuser.set('post', 0);
            cbuser.set('sold', 0);
            cbuser.set('closed', 0);
            cbuser.set('bought', 0);
            cbuser.set('accepted', 0);
				    cbuser.save({
					      success: function(user) {
						        //Registration successfull
        						var token = createJWT(user.get('id'));
        			      res.send({ token: token, wizard: true });
      					},
      					error: function(err){
      						//Error in user registration.
                  var q = new CB.CloudQuery('User');
                  q.equalTo('email',profile.email);
                  q.findOne({
                    success: function(obj){
                      if(obj){
                        obj.set('facebook', profile.id);
                        obj.save({
                          success: function(){
                            //Registration successfull
                            var token = createJWT(obj.get('id'));
                            res.send({ token: token, wizard: false, id: obj.get('id'), name: profile.name, email: profile.email });
                          },
                          error: function(err){
                            console.log(err);
                            return res.status(400).send({message: 'Oops!! somthing went wrong while logging in..'});
                          }
                        });
                      }else {
                        console.log(err);
                        return res.status(400).send({message: 'Oops!! somthing went wrong while logging in..'});
                      }
                    },
                    error: function(err){
                      console.log(err);
                    }
                  });
      						console.log(err);
      					}
      				});
        	},
        	error: function(err){
        		console.log(err);
        	}
        });

        }
    });
  });
});
