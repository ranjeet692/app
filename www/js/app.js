// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var underscore = angular.module('underscore', []);
underscore.factory('_', function() {
  return window._; //Underscore must already be loaded on the page
});

angular.module('fyipe', ['ionic', 'fyipe.controllers', 'fyipe.services', 'satellizer', 'underscore', 'mentio', 'ngTagsInput'])

.run(function($ionicPlatform, $rootScope, $interval) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    CB.CloudApp.init('fyipeprod', 'Qfq6NfpOF7oFZ18gMI95QA==');
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

  var profession = new CB.CloudQuery('Profession');
  profession.setLimit(2000);
  profession.find({
    success: function(list){
      $rootScope.profession = $rootScope.serialize(list);
    },
    error: function(err) {
      console.log(err);
    }
  });

  var query  = new CB.CloudQuery('Location');
  query.selectColumn('city');
  query.selectColumn('country');
  query.find({
    success: function(list){
      $rootScope.location = $rootScope.serialize(list);
    },
    error: function(err) {
      console.log(err);
    }
  });

  $rootScope.serialize = function(object){
    var seen = [];
    return JSON.stringify(object, function(key, val) {
     if (val !== null && typeof val == "object") {
          if (seen.indexOf(val) >= 0) {
              return;
          }
          seen.push(val);
      }
      return val;
    });
  };
  $rootScope.activeUserList = [];
  $rootScope.notificationCount = 0;
  $rootScope.messageCounter = 0;
  var stop = $interval(function(){
    if($rootScope.userProfile){
      console.log("timer working");
      var activeUser = new CB.CloudObject('User', $rootScope.userProfile.document._id);
      var query = new CB.CloudQuery('onlineUser');
      query.equalTo('user', activeUser);
      query.findOne({
        success: function(user){
           var now = moment();
            if(user){
              user.set('lastActive', now.toString());
              user.set('status', 'online');
              user.save({
                success: function(object){

                },error:function(){

                }
              });
            }else{
              var object = new CB.CloudObject('onlineUser');
              object.set('user', activeUser);
              object.set('status', 'online');
              object.set('lastActive', now.toString());
              object.save({
                success: function(){

                },error: function(){

                }
              });
            }
        },error: function(err){
          console.log(err);
        }
      });
      query = new CB.CloudQuery('onlineUser');
      query.equalTo('status', 'online');
      if($rootScope.chatUserList){
        query.equalTo('user', $rootScope.chatUserList);
      }
      query.find({
        success: function(user){
          if(user.length>0){
            for (var i = 0; i < user.length; i++) {
              var now = moment();
              var difference = now.diff(user[i].get('lastActive'), 'seconds');
                $rootScope.activeUserList[(user[i].get('user')).document._id] = true;
              if(difference > 60){
                $rootScope.$apply(function (){
                  $rootScope.activeUserList[(user[i].get('user')).document._id] = false;
                });
                user[i].set('status', 'offline');
                user[i].save();
              }
            }
          }
        },error:function(err){
          console.log(err);
        }
      });
    }
  }, 1000*20);
  });


})

.config(function($stateProvider, $urlRouterProvider, $authProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.search', {
    url: '/search',
    views: {
      'menuContent': {
        templateUrl: 'templates/search.html'
      }
    }
  })

    .state('app.login', {
      url: '/login',
      views: {
        'menuContent': {
          templateUrl: 'templates/login.html',
          controller: 'LoginCtrl'
        }
      }
    })
  .state('app.signup', {
    url: '/signup',
    views: {
      'menuContent': {
        templateUrl: 'templates/signup.html',
        controller: 'LoginCtrl'
      }
    }
  })
  .state('app.logout', {
     url: '/logout',
     views: {
       'menuContent': {
         template: null,
         controller: 'LogoutCtrl',
         resolve: {
           authenticated: function($q, $location, $auth) {
             var deferred = $q.defer();
             if (!$auth.isAuthenticated()) {
               $state.go('app.login');
             } else {
               deferred.resolve();
             }
             return deferred.promise;
           }
         }
       }
     }
   })
  .state('app.balance', {
    url: '/balance',
    views: {
      'menuContent': {
        templateUrl: 'templates/balance.html',
        controller: 'BalanceCtrl'
      }
    }
  })
  .state('app.requirements', {
    url: '/requirements',
    views: {
      'menuContent': {
        templateUrl: 'templates/requirements.html',
        controller: 'RequirementsCtrl'
      }
    }
  })
  .state('app.success', {
    url: '/success',
    params:{'price': null, 'user':null, 'referenceId': null},
    views: {
      'menuContent': {
        templateUrl: 'templates/success.html',
        controller: 'SuccessCtrl'
      }
    }
  })
  .state('app.newpost', {
    url: '/newpost',
    views: {
      'menuContent': {
        templateUrl: 'templates/newPost.html',
        controller: 'NewPostCtrl'
      }
    }
  })
  .state('app.postbyme', {
    url: '/postbyme',
    views: {
      'menuContent': {
        templateUrl: 'templates/postbyme.html',
        controller: 'PostbymeCtrl'
      }
    }
  })
  .state('app.boughtdeals', {
    url: '/boughtdeals',
    views: {
      'menuContent': {
        templateUrl: 'templates/bought.html',
        controller: 'BoughtdealsCtrl'
      }
    }
  })
  .state('app.notification', {
    url: '/notification',
    views: {
      'menuContent': {
        templateUrl: 'templates/notification.html',
        controller: 'NotificationCtrl'
      }
    }
  })
  .state('app.post', {
    url: '/post',
    params:{'id': null, 'type': null},
    views: {
      'menuContent': {
        templateUrl: 'templates/post.html',
        controller: 'PostCtrl'
      }
    }
  })
  .state('app.messages', {
    url: '/messages',
    views: {
      'menuContent': {
        templateUrl: 'templates/messages.html',
        controller: 'MessagesCtrl'
      }
    }
  })
  .state('app.chat', {
    url: '/chat',
    params:{'userId': null, 'name':null},
    views: {
      'menuContent': {
        templateUrl: 'templates/chat.html',
        controller: 'ChatCtrl'
      }
    }
  })
  .state('app.group', {
    url: '/group',
    views: {
      'menuContent': {
        templateUrl: 'templates/group.html',
        controller: 'GroupCtrl'
      }
    }
  })
  .state('app.wizard', {
    url: '/wizard',
    views: {
      'menuContent': {
        templateUrl: 'templates/wizard.html',
        controller: 'WizardCtrl'
      }
    }
  })
  .state('app.invite', {
    url: '/invite',
    views: {
      'menuContent': {
        templateUrl: 'templates/invite.html',
        controller: 'InviteCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/login');
  if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
      $authProvider.cordova = true;
  }

  $authProvider.facebook({
    clientId: '1607203249542639',
  });

  $authProvider.google({
    clientId: '773677402406-6ra9rv1vd8u24pc2djg22hn4iqabr7qo.apps.googleusercontent.com'
  });

  $authProvider.linkedin({
    clientId: '77alkkzow0uz50'
  });
});
