angular.module('fyipe.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

})

.controller('LoginCtrl', function($scope, $state, $http, $ionicHistory, $ionicModal, $timeout, $auth, $cordovaOauth, SocialLogin, Token){
  $scope.lemail = "";
  $scope.lpassword="";
  $scope.authenticate = function(provider) {
      $auth.authenticate(provider)
        .then(function(response) {
          if(response.status == 200){
            $ionicHistory.nextViewOptions({
              disableBack: true
            });
            if(response.data.wizard){
              $state.go('app.wizard');
            }else {
              $state.go('app.requirements');
            }
          }
        })
        .catch(function(response) {

        });
    };

    $scope.login = function(lemail, lpassword) {

      $auth.login({ email: lemail, password: lpassword })
        .then(function(response) {
          if(response.status == 200){
            $ionicHistory.nextViewOptions({
              disableBack: true
            });
            if(response.data.wizard){
              $state.go('app.wizard');
            }else {
              $state.go('app.requirements');
            }
          }
        })
        .catch(function(response) {
          console.log(response);
        });
    };

    $scope.logout = function() {
      $auth.logout();
    };

    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };

    $scope.signup = function(user) {
      $auth.signup({
         displayName: user.displayName,
         email: user.email,
         password: user.password
       }).then(function(response) {
         if(response.status == 200){
           $state.go('app.wizard');
         }
       }).catch(function(response) {

       });
   };
   
   if($scope.isAuthenticated()){
      $ionicHistory.nextViewOptions({
          disableBack: true
      });
     $state.go('app.requirements');
   }
   $scope.facebook = function(){
     $cordovaOauth.facebook("1607203249542639", ["email", "publish_actions"]).then(function(result) {
        $scope.result = result;
        $http.get("https://graph.facebook.com/v2.2/me", { params: { access_token: result.access_token, fields: "id,name,gender,location,website,picture,relationship_status", format: "json" }}).then(function(result) {
                $scope.profile = result.data;
                SocialLogin.userAccount($scope.profile, "facebook").then(function(data){
                  Token.createJWT($scope.profile.id).then(function(token){
                    $auth.setToken(token);
                  }).catch(function(err){
                    
                  });
                  $ionicHistory.nextViewOptions({
                    disableBack: true
                  });
                  
                  if(data.wizard){
                    $state.go('app.wizard');
                  }else {
                    $state.go('app.requirements');
                  }
                }).catch(function(err){
                  
                });
            }, function(error) {
                alert("There was a problem getting your profile.");
                console.log(error);
            });
    }, function(error) {
        // error
        alert("Unable to connect with facebook.");
    });
   };
   
   $scope.google = function(){
     $cordovaOauth.google("773677402406-286mu1bppkes52dhsnicq9g3tm8tjdta.apps.googleusercontent.com", ['profile', 'email', 'https://www.google.com/m8/feeds/', 'https://www.googleapis.com/auth/plus.login']).then(function(result) {
        $scope.result = result;
        $http.get("https://www.googleapis.com/plus/v1/people/me/openIdConnect", {headers:{ Authorization: 'Bearer ' + result.access_token }}, {params:{format: "json"}}).then(function(result){
          $scope.profile = result.data;
          SocialLogin.userAccount($scope.profile, "google").then(function(data){
                  Token.createJWT($scope.profile.sub).then(function(token){
                    $auth.setToken(token);
                  }).catch(function(err){
                    
                  });
                  $ionicHistory.nextViewOptions({
                    disableBack: true
                  });
                  
                  if(data.wizard){
                    $state.go('app.wizard');
                  }else {
                    $state.go('app.requirements');
                  }
                }).catch(function(err){
                  
                });
        }, function(error){
          alert("Unable to fetch profile data");
        });
    }, function(error) {
        // error
        alert("Unable to connect with google.");
    });
   };
   
   $scope.linkedIn = function(){
     $cordovaOauth.linkedin("77alkkzow0uz50", 'A4A2kdqpUbljnx7V',["r_emailaddress"]).then(function(result) {
        $scope.result = result;
        $http.get("https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url)", {params:{oauth2_access_token: result.access_token, format: 'json'}}).then(function(result){
          $scope.profile = result.data;
          SocialLogin.userAccount($scope.profile, "linkedin").then(function(data){
                  Token.createJWT($scope.profile.id).then(function(token){
                    $auth.setToken(token);
                  }).catch(function(err){
                    
                  });
                  $ionicHistory.nextViewOptions({
                    disableBack: true
                  });
                  
                  if(data.wizard){
                    $state.go('app.wizard');
                  }else {
                    $state.go('app.requirements');
                  }
                }).catch(function(err){
                  
                });
        }, function(error){
          alert("Unable to fetch profile data from linkedIn");
        });
    }, function(error) {
        // error
        alert("Unable to connect with linkedIn.");
    });
   };
   
   $scope.twitter = function(){
     $cordovaOauth.twitter("nFq8ge5PHqi9ELOqkC6OCs18O", "ks9tuziy7kjRQc9WMsib9n6YNpGf7rB5wKhlVeiVUqVGXwWCiH").then(function(result){
       
     }, function(error){
       alert("Unable to connect to Twitter.");
     });
   };
})
.controller('LogoutCtrl', function($rootScope, $scope, $ionicModal, $timeout, $auth){
  if (!$auth.isAuthenticated()) {
        return;
  }
  $auth.logout().then(function(){
    $rootScope.userProfile = null;
  });
})
.controller('BalanceCtrl', function($rootScope, $scope, $ionicModal, $timeout, Account){
  Account.getProfile()
    .success(function(data) {
      $scope.user = data;
      $rootScope.userProfile = CB.fromJSON(data);
      
    })
    .error(function(error) {
      
    });
    
    
})
.controller('RequirementsCtrl', function($rootScope, $scope, $state, $ionicModal, $timeout, Account, FeedService, ProfessionService, LocationService, User, Payment){
  $scope.feedCount = 0;
  $scope.defaultName = "Anonymous";
  $scope.defaultPicture = "img/profile.png";
  $scope.ownIt=[];
  $scope.feedFromDB = [];
  $scope.dealOperation = [];
  $scope.noMoreItemsAvailable = false;
  if(!$rootScope.userProfile){
     Account.getProfile()
       .success(function(data) {
         $scope.user = data;
         $rootScope.userProfile = CB.fromJSON(data);
         $scope.cbUserOuery = new CB.CloudQuery('User');
         $scope.cbUserOuery.get($scope.user.document._id, {
           success: function(obj){
             if(obj.length > 0){
               $scope.currentUser = obj;
               $scope.getUnReadMessageCount();
             }
           }
         });
       })
       .error(function(error) {
         toastr.error(error, "Error While Loading User Profile");
       });
   }else{
     $scope.user = $rootScope.userProfile;
   }

   FeedService.fetch($scope.feedCount)
     .success(function(data){
       if(data.length > 0){
         $scope.feedFromDB = data;
         $rootScope.globalfeedFromDB = data;
         var rankData;
         if($scope.feedFromDB.length < 5){
           $scope.noMoreItemsAvailable = true;
           console.log($scope.noMoreItemsAvailable);
         }
         for(var i=0; i<$scope.feedFromDB.length; i++){
           rankData = {"post":$scope.feedFromDB[i].document.post,"closed":$scope.feedFromDB[i].document.closed};
           $scope.feedFromDB[i].document.rate = $scope.rating(rankData);
           $scope.feedFromDB[i].isCollapsed = true;
           $scope.feedFromDB[i].commitButton = false;
           $scope.feedFromDB[i].committing = false;
         }

         FeedService.ownIt(data).then(function(object){
           for (var i = 0; i < object.length; i++) {
             $scope.ownIt[object[i].document.feed.document._id] = object[i];
           }
         });

         for(var i=0; i<$scope.feedFromDB.length; i++){
           FeedService.sentTo($scope.feedFromDB[i].document._id,i).success(function(res){
             $scope.feedFromDB[res.index].sentto = res.count;
           }).error(function(err){
             $scope.feedFromDB[err.index].sentto = err.count;
           });
           FeedService.seenBy($scope.feedFromDB[i].document._id,i).success(function(res){
             $scope.feedFromDB[res.index].seenby = res.count;
           }).error(function(err){
             $scope.feedFromDB[err.index].seenby = err.count;
           });
         }
     }else {
       $scope.feedFromDB = [];
       $scope.nostream = true;
     }
   }).error(function(error){
     $scope.feedFromDB = [];
     $scope.nostream = true;
     $state.go('app.wizard');
   });

   if(!$rootScope.profession){
     ProfessionService.getSource()
      .success(function(list) {
        $rootScope.profession = CB.fromJSON(list);
     }).error(function(err){

     });
   }

   if(!$rootScope.location){
     LocationService.getSource().success(function(list) {
       $rootScope.location = CB.fromJSON(list);
     }).error(function(err){

     });
   }

   $scope.timeConversion = function(time){
      return moment(time).unix();
    };

  $scope.rating = function(data){
     if(data){
       if(data.post > 0){
         if(data.closed > 0){
           return "Closed "+data.closed+' | '+"Opened "+data.post;
         }else{
           return "New Seller";
         }
       }
       return "New Seller";
     }else{
       return "New Seller";
     }
   };
   $scope.ratingBuyer = function(data){
     if(data){
       if(data.bought > 0){
         if(data.accepted > 0){
           return data.accepted+'/'+data.bought;
         }else{
           return "New Buyer";
         }
       }
       return "New Buyer";
     }else{
       return "New Buyer";
     }
   };

   $scope.loadMore = function(){
     $scope.feedCount += 5;
     console.log("load more");
     FeedService.fetch($scope.feedCount)
       .success(function(obj){
         if(obj.length < 5){
           $scope.noMoreItemsAvailable = true;
           console.log($scope.noMoreItemsAvailable);
         }
         for(i=0; i<obj.length; i++){
           rankData = {"post":obj[i].document.post,"closed":obj[i].document.closed};
           obj[i].document.rate = $scope.rating(rankData);
           $scope.feedFromDB.push(obj[i]);
           obj[i].isCollapsed = true;
         }

         FeedService.ownIt(obj).then(function(object){
           for (var i = 0; i < object.length; i++) {
             $scope.ownIt[object[i].document.feed.document._id] = object[i];
           }

         });
         var soldFeed = _.pluck(obj, "document");
         soldFeed = _.where(soldFeed, {soldToUser:true});

         for(var i= $scope.feedCount; i<$scope.feedFromDB.length; i++){
           FeedService.sentTo($scope.feedFromDB[i].document._id,i).success(function(res){
             $scope.feedFromDB[res.index].sentto = res.count;
           }).error(function(err){
             $scope.feedFromDB[err.index].sentto = err.count;
           });
           FeedService.seenBy($scope.feedFromDB[i].document._id,i).success(function(res){
             $scope.feedFromDB[res.index].seenby = res.count;
           }).error(function(err){
             $scope.feedFromDB[err.index].seenby = err.count;
           });
         }
       }).error(function(error){
         
       });
   };

   $scope.commit = function(index){
      $scope.feedFromDB[index].committing = true;
      var payload = {
        "feed": $scope.feedFromDB[index].document._id,
          "amount": $scope.feedFromDB[index].document.price
      };
      Payment.commit(payload).success(function(data){
        $scope.feedFromDB[index].committing = false;
        $scope.feedFromDB[index].commitButton= true;
        $state.go('app.success', {'price': $scope.feedFromDB[index].document.price, 'user': data.user.document._id, 'referenceId': data.referenceId});
      }).error(function(err){
        $scope.feedFromDB[index].committing = false;
      });
    };

   $scope.dealClose = function(feedId, index, post){
   $scope.dealOperation[index] = true;
   var data = {feedId:feedId};
   Payment.close(data, 'feed').success(function(msg){
     $scope.dealOperation[index] = false;
     $state.go('app.balance');
   }).error(function(err){
     $scope.dealOperation[index] = false;
   });
 };

 $scope.refund = function(feedId, index, post){
   $scope.dealOperation[index] = true;
   var transaction = new CB.CloudQuery('buyerStatus');
   var feedObj = new CB.CloudObject('Feed',feedId);
   var userObj = new CB.CloudObject('User',$scope.user.document._id);
   Payment.refund({"feed":feedObj}).success(function(status){
       $scope.dealOperation[index] = false;
       $scope.feedFromDB.splice(index, 1);
   }).error(function(err){
       $scope.dealOperation[index] = false;
   });
 };
   $ionicModal.fromTemplateUrl('reportModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.reportModal = modal;
    });

    $ionicModal.fromTemplateUrl('userModal.html', {
       scope: $scope,
       animation: 'slide-in-up'
     }).then(function(modal) {
       $scope.userModal = modal;
     });

    $scope.openModal = function(type, data) {
      if(type === "report")
        $scope.reportModal.show();
      else{
        $scope.userModal.show();
        $scope.userName = data.document.user.document.displayName || "Anonymous";
        if(data.user){
          User.professionInfo(data.document.profession[0].document._id).then(function(res){
            $scope.profession = res.document.name;
          }).catch(function(err){

          });
          User.locationInfo(data.document.location[0].document._id).then(function(res){
            $scope.location = res.document.city;
          }).catch(function(err){

          });
          $scope.profilePic = data.document.user.document.picture || "img/profile.png";
          $scope.phone = data.document.user.document.phone;
      }
    }
  };

  $scope.closeModal = function(type) {
    if(type === "type")
      $scope.reportModal.hide();
    else
      $scope.userModal.hide();
  };

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });
})
.controller('SuccessCtrl', function($rootScope, $scope, $stateParams, Account){

  var cbUser = new CB.CloudQuery('User');
  $scope.sellerStatus = false;

  if(!$rootScope.userProfile){
     Account.getProfile().success(function(data) {
       $scope.user = data;
       $rootScope.userProfile = CB.fromJSON(data);
       $scope.cbUserOuery = new CB.CloudQuery('User');
       $scope.cbUserOuery.get($scope.user.document._id, {
         success: function(obj){
           if(obj.length > 0){
             $scope.currentUser = obj;
             $scope.getUnReadMessageCount();
           }
         },error:function(err){

         }
       });
     })
     .error(function(error) {
       toastr.error(error, "Error While Loading User Profile");
     });
   }else{
     $scope.user = $rootScope.userProfile;
   }

  cbUser.get($stateParams.user,{
    success: function(obj){
      $scope.seller = obj;
      $scope.sellerStatus = true;
    }
  });

  $scope.startChat = function(user, name){
    $state.go('app.chat', {'userId': user, 'name': name});
  };


})
.controller('NewPostCtrl', function($rootScope, $scope, $ionicModal, $stateParams, $timeout, Account, ProfessionService, LocationService, FeedService, GroupService, _){
  $scope.prof = [];
  $scope.professionTagged = [];
  $scope.locationTagged = [];
  if(!$rootScope.userProfile){
     Account.getProfile()
       .success(function(data) {
         $scope.user = data;
         $rootScope.userProfile = CB.fromJSON(data);
         $scope.cbUserOuery = new CB.CloudQuery('User');
         $scope.cbUserOuery.get($scope.user.document._id, {
           success: function(obj){
             if(obj.length > 0){
               $scope.currentUser = obj;
               $scope.getUnReadMessageCount();
             }
           }
         });
       })
       .error(function(error) {
         
       });
   }else{
     $scope.user = $rootScope.userProfile;
   }

   if(!$rootScope.profession){
     ProfessionService.getSource().success(function(list){
       buildProfessionTags(list);
       $rootScope.profession = CB.fromJSON(list);
     }).error(function(err){

     });
   }else{
     buildProfessionTags($rootScope.profession);
   }

   if(!$rootScope.location){
     LocationService.getSource().success(function(list){
       buildLocationTags(list);
       $rootScope.location = list;
     }).error(function(err){

     });
   }else{
     buildLocationTags($rootScope.location);
   }

   function buildProfessionTags(obj){
     var list = CB.toJSON(obj);
     $scope.professionItems = _.pluck(list, 'document');
     $scope.professionTags = _.pluck($scope.professionItems, 'name');
     for(var i=0; i<$scope.professionTags.length; i++){
       if($scope.professionItems[i])
        $scope.prof.push({"label": $scope.professionItems[i].name, "id":$scope.professionItems[i]._id, "table":$scope.professionItems[i]._tableName });
     }
   }

   function buildLocationTags(obj){
     var list = CB.toJSON(obj);
     $scope.locationItems = _.pluck(list, 'document');
     for(var i=0; i<$scope.locationItems.length; i++){
       if($scope.locationItems[i])
        $scope.prof.push({"label": $scope.locationItems[i].city+', '+$scope.locationItems[i].country, "id":$scope.locationItems[i]._id, "table":$scope.locationItems[i]._tableName });
     }
   }

   $scope.taggedKeywords = function(item){
     if(item.table == "Profession"){
       $scope.professionTagged.push(item);
     }else if (item.table == "Location") {
       $scope.locationTagged.push(item);
     }
     return "@"+item.label;
   };
   $scope.countOf = function(text) {
      var s = text ? text.split(/\s+/) : 0; // it splits the text on space/tab/enter
      return s ? s.length : '';
   };

   $scope.savePost = function(feed) {
    $scope.postPending = true;
    $scope.nostream = false;
    $scope.spinner = false;
     if($scope.picFile){
       UploadService.imageUpload($scope.picFile).then(function(obj){
         console.log("file saved.." + obj.document.url);
         $scope.post(feed, obj.document.url);
       }).catch(function(err){
         console.log("error"+ err);
       });
     }else {
       $scope.post(feed);
     }
   };

    $scope.post = function(feed, imageUrl){
      var n;
      if(parseFloat($rootScope.userProfile.document.balance) > 100){

      }else if($scope.professionTagged.length > 0 && $scope.locationTagged.length > 0 && feed.information){
        for(var i=0; i<$scope.professionTagged.length; i++){
          n = feed.information.indexOf("@"+$scope.professionTagged[i].label.trim());
          if(n < 0){
            $scope.professionTagged.splice(i, 1);
          }
        }
        for(i=0; i<$scope.locationTagged.length; i++){
          n = feed.information.indexOf("@"+$scope.locationTagged[i].label);
          if(n < 0){
            $scope.locationTagged.splice(i, 1);
          }
        }
        var feedData = {
          information: feed.information,
          profession: $scope.professionTagged,
          location: $scope.locationTagged,
          free: feed.free,
          price: feed.price,
          url: imageUrl
        };
        feed.information = "";
        $scope.professionTagged = [];
        $scope.locationTagged = [];
        feed.free = false;
        feed.price = null;
        $scope.picFile = "";
        if($stateParams.type === "group"){
          GroupService.save(feedData).then(function(obj){
            
          }).catch(function(err){
            
          }); 
        }else{
          FeedService.save(feedData).then(function(obj) {

        }).catch(function(err){

        });  
        }
      }else{
        $scope.postPending = false;
      }
  };
})
.controller('PostbymeCtrl', function($rootScope, $scope, $ionicModal, $timeout,  Account,FeedService, Payment){
  $scope.noSoldData = false;
  $scope.noPostData  = false;
  $scope.postPending = true;
  $scope.soldFeed = [];
  $scope.postFeed = [];
  $scope.soldDealStatus = [];
  $scope.feedCount = 0;
  $scope.defaultPicture = "img/profile.png";
  $scope.ratingBuyer = function(data){
    if(data){
      if(data.bought > 0){
        if(data.accepted > 0){
          return data.accepted+'/'+data.bought;
        }else{
          return "New Buyer";
        }
      }
      return "New Buyer";
    }else{
      return "New Buyer";
    }
  }
  if(!$rootScope.userProfile){
    Account.getProfile()
      .success(function(data) {
        $scope.user = data;
        $rootScope.userProfile = CB.fromJSON(data);
        getSoldDeal();
        getPostByMe();
      })
      .error(function(error) {
        
    });
  }else{
    $scope.user = $rootScope.userProfile;
    getSoldDeal();
    getPostByMe();
  }



  function getSoldDeal(){
    FeedService.soldDeal('feed').then(function(data){
       //$scope.soldFeed = data;
       $scope.noSoldData = false;
       $scope.postPending = false;
       if(data.length <=0 ){
         $scope.noSoldData = true;
       }
       FeedService.soldDeal('group').then(function(groupData){
         if(groupData.length <=0 ){
           $scope.noSoldData = true;
         }else{
           $scope.noSoldData = false;
         }
         if(groupData){ 
           data = _.union(data, groupData);
         }
         $scope.soldFeed = data;
         for(var i=0; i<data.length; i++){
           FeedService.soldDealStatus(data[i].document._id, data[i].document.group).then(function(object){
             if(object[0]){
               for(var j=0; j<object.length; j++){
                 var rankData = {"bought": object[j].document.buyer.document.bought, "accepted":object[j].document.buyer.document.accepted};
                 object[j].document.buyer.document.rate = $scope.ratingBuyer(rankData);
               }
               if(object[0].document.feed)
                  $scope.soldDealStatus[object[0].document.feed.document._id] = object;
              else if(object[0].document.groupFeed)
                  $scope.soldDealStatus[object[0].document.groupFeed.document._id] = object;
             }
           });
         }
       }).catch(function(){
         $scope.postPending = false;
       });
    }).catch(function(err){
      $scope.noSoldData = true;
      $scope.postPending = false;
    });
  }

  function getPostByMe(){
    FeedService.postByMe('feed').then(function(data){
      if(data.length > 0){
        $scope.noPostData = false;
        $scope.postFeed = data;
        $scope.postPending = false;
      }else{
        $scope.noPostData = true;
      }
      FeedService.postByMe('group').then(function(groupData){
        //data = _.union(data, groupData);
        if(groupData.length > 0 )
          $scope.noPostData = false;

        for(var i=0; i<groupData.length; i++){
          $scope.postFeed.push(groupData[i]);
        }

      }).catch(function(){

      });
    }).catch(function(err){
      $scope.noPostData = true;
      $scope.postPending = false;
    });
  }

  $scope.timeConversion = function(time){
    return moment(time).unix();
  }
})
.controller('BoughtdealsCtrl', function($rootScope, $scope, $state, $ionicModal, $timeout, Account,FeedService, Payment){
  $scope.noPendingData = false;
  $scope.noBoughtData = false;
  $scope.postPending = true;
  $scope.pendingFeed = [];
  $scope.boughtFeed = [];
  $scope.dealOperation = [];
  $scope.loadDataStatus = false;
  $scope.feedCount = 0;
  $scope.defaultPicture = "partials/assets/avatars/profile.png";
  $scope.rating = function(data){
    if(data){
      if(data.post > 0){
        if(data.closed > 0){
          return "Closed "+data.closed+' | '+"Opened "+data.post;
        }else{
          return "New Seller";
        }
      }
      return "New Seller";
    }else{
      return "New Seller";
    }
  }
  $scope.ratingBuyer = function(data){
    if(data){
      if(data.bought > 0){
        if(data.accepted > 0){
          return data.accepted+'/'+data.bought;
        }else{
          return "New Buyer";
        }
      }
      return "New Buyer";
    }else{
      return "New Buyer";
    }
  }

  if(!$rootScope.userProfile){
    Account.getProfile()
      .success(function(data) {
        $scope.user = data;
        $rootScope.userProfile = CB.fromJSON(data);
        getPendingDeal();
        getBoughtDeal();
        //$scope.getUnReadMessageCount();
      })
      .error(function(error) {
        
    });
  }else{
    $scope.user = $rootScope.userProfile;
    getPendingDeal();
    getBoughtDeal();
  }

  function getPendingDeal(){
    FeedService.pendingDeal('feed').success(function(pendingData){
      if(pendingData.length > 0){
        $scope.noPendingData = false;
        $scope.postPending = false;
        for(var i=0; i<pendingData.length; i++){
            var rankData = {"post": pendingData[i].document.user.document.post, "closed":pendingData[i].document.user.document.closed};
            pendingData[i].document.rate = $scope.rating(rankData);
            $scope.pendingFeed.push(pendingData[i]);
          }
        }else{
          $scope.postPending = false;
          $scope.noPendingData = true;
        }
        FeedService.pendingDeal('group').success(function(groupData){
          //data = _.union(data, groupData);
          //data = _.sortBy(data, 'createdAt');
          for(var i=0; i<groupData.length; i++){
            var rankData = {"post": groupData[i].document.user.document.post, "closed":groupData[i].document.user.document.closed};
            groupData[i].document.rate = $scope.rating(rankData);
            $scope.pendingFeed.push(groupData[i])
          }
        }).catch(function(err){
          console.log(err);
        });

    }).error(function(err){
       $scope.noPendingData = true;
       $scope.postPending = false;
    });
  }

  function getBoughtDeal(){
    FeedService.boughtDeals('feed').then(function(data){
      if(data.length > 0){
        $scope.noBoughtData = false;
        $scope.boughtFeed = data;
        for(var i=0; i<data.length; i++){
          var rankData = {"post": data[i].document.user.document.post, "closed":data[i].document.user.document.closed};
          data[i].document.rate = $scope.rating(rankData);
        }
        FeedService.boughtDeals('group').then(function(groupData){
          //data = _.union(data, groupData);
          //data = _.sortBy(data, 'createdAt');
          $scope.postPending = false;
          for(var i=0; i<groupData.length; i++){
            var rankData = {"post": groupData[i].document.user.document.post, "closed":groupData[i].document.user.document.closed};
            groupData[i].document.rate = $scope.rating(rankData);
            $scope.boughtFeed.push(groupData[i]);
          }
        }).catch(function(err){
          console.log(err);
        });
      }else{
        $scope.noBoughtData = true;
      }
    }).catch(function(err){
      toastr.error("Unable to fetch bought deals data","Error");
      $scope.noBoughtData = true;
      $scope.postPending = false;
    });
  }

  $scope.dealClose = function(feedId, index, post, group){
    $scope.dealOperation[index] = true;
    var data = {feedId:feedId};
    var type;
    if(!group){
      type = 'feed';
    }else{
      type = 'group';
    }
    Payment.close(data, type).success(function(msg){
      $scope.pendingFeed.slice(index,1);
      toastr.success("Deal Closed");
      mixpanel.track('Deal Closed',{
        "Information":post.document.information,
        "Seller": post.document.user.document.email,
        "Price": post.document.price
      });
      $scope.dealOperation[index] = false;
      $scope.pendingFeed.splice(index, 1);
      window.location.href = "/#/account";
    }).error(function(err){
      toastr.error(err, "Error");
      $scope.dealOperation[index] = false;
    });
  };

  $scope.refund = function(feedId, index, post, group){
    $scope.dealOperation[index] = true;
    var data;
    var transaction = new CB.CloudQuery('buyerStatus');
    var userObj = new CB.CloudObject('User',$scope.user.document._id);
    var feedObj;
    if(!group){
      feedObj = new CB.CloudObject('Feed',feedId);
      data = {"feed": feedObj};
    }else{
      feedObj = new CB.CloudObject('GroupFeed',feedId);
      data = {"groupfeed": feedObj};
    }

    Payment.refund(data).success(function(status){
      toastr.success(status);
      mixpanel.track('Refund',{
        "Information":post.document.information,
        "Seller": post.document.user.document.email,
        "Price": post.document.price
      });
      $scope.dealOperation[index] = false;
      $scope.pendingFeed.splice(index,1);
    }).error(function(err){
      $scope.dealOperation[index] = false;
      toastr.error(err, "Error");
    });
  };

  $scope.timeConversion = function(time){
    return moment(time).unix();
  };

  $scope.openUser = function(index, type) {
    var modalInstance;
    if(type === "pending"){
      modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: 'userModal.html',
        controller: 'userModalCtrl',
          resolve: {
                  data: function(){
                    return $scope.pendingFeed[index].document;
                  }
          }
      });
    }else{
      modalInstance = $modal.open({
        animation: $scope.animationsEnabled,
        templateUrl: 'userModal.html',
        controller: 'userModalCtrl',
          resolve: {
                  data: function(){
                    return $scope.boughtFeed[index].document;
                  }
          }
      });
    }


      modalInstance.result.then(function(data) {

      }, function () {
          $log.info('Modal dismissed at: ' + new Date());
      });
  };

  $scope.startChat = function(userId, name){
    $state.go('app.chat', {'userId': userId, 'name': name});
  };
})
.controller('NotificationCtrl', function($rootScope, $scope, $state, $ionicModal, $ionicPopup, $timeout, FeedService, Account){
   $scope.userDictionary = [];
   $scope.defaultName = "Anonymous";
   $scope.defaultPicture = "img/profile.png";
   if(!$rootScope.userProfile){
     Account.getProfile()
       .success(function(data) {
         $scope.user = data;
         $rootScope.userProfile = CB.fromJSON(data);
         $scope.cbUserOuery = new CB.CloudQuery('User');
         $scope.cbUserOuery.get($scope.user.document._id, {
           success: function(obj){
             if(obj.length > 0){
               $scope.currentUser = obj;
               $scope.getUnReadMessageCount();
             }
           }
         });
       })
       .error(function(error) {

       });
   }else{
     $scope.user = $rootScope.userProfile;
   }

   function markRead(){
     $rootScope.notificationCount = 0;
     var noticeObj;
     for(var i=0; i<$scope.notificationData.length; i++){
       noticeObj = new CB.CloudObject('Notification', $scope.notificationData[i].document._id);
       noticeObj.set('read', true);
       noticeObj.save({
         success: function(){

         },error: function(){

         }
       });
     }
   }

   $scope.getUnReadMessageCount = function(){
     var cbQuery = new CB.CloudQuery('Chat');
     cbQuery.equalTo('to', $scope.currentUser);
     cbQuery.equalTo('read', false);
     cbQuery.count({
       success: function(count){
         $scope.messageCounter += count;
       }
     });
   };

   $scope.timeConversion = function(time){
     return moment(time).unix();
   };

   FeedService.notification().then(function(obj) {
     if(obj.data.length > 0){
       $rootScope.notificationCount = 0;
       for(var i=0; i<obj.data.length; i++){
         if(obj.data[i].document.read === false)
           $rootScope.notificationCount++;
       }
       $scope.notificationData = obj.data;
       $scope.feedItems = _.pluck(obj.data, 'document');
       $scope.feedItems1 = _.pluck($scope.feedItems, 'post');
       $scope.feedItems1 = _.pluck($scope.feedItems1, 'document');
       $scope.feedItems1 = _.pluck($scope.feedItems1, 'user');
       $scope.feedItems1 = _.pluck($scope.feedItems1, 'document');
       $scope.feedItems1 = _.pluck($scope.feedItems1, '_id');
       $scope.feedItems2 = _.pluck($scope.feedItems, 'groupPost');
       $scope.feedItems2 = _.pluck($scope.feedItems2, 'document');
       $scope.feedItems2 = _.pluck($scope.feedItems2, 'user');
       $scope.feedItems2 = _.pluck($scope.feedItems2, 'document');
       $scope.feedItems2 = _.pluck($scope.feedItems2, '_id');
       $scope.feedItems1 = _.filter($scope.feedItems1, Boolean);
       $scope.feedItems2 = _.filter($scope.feedItems2, Boolean);
       $scope.feedItems3 =  _.pluck($scope.feedItems, 'notice');
       $scope.feedItems3 = _.pluck($scope.feedItems3, 'user');
       $scope.feedItems3 = _.pluck($scope.feedItems3, 'document');
       $scope.feedItems3 = _.pluck($scope.feedItems3, '_id');
       $scope.feedItems3 = _.filter($scope.feedItems3, Boolean);
       users = _.union( $scope.feedItems1, $scope.feedItems2,  $scope.feedItems3);
       console.log(users);
       users = _.uniq(users);
       console.log(users);
       var query = new CB.CloudQuery('User');
       for(i=0; i<users.length;i++){
         query.get(users[i], {
           success: function(obj){
             $scope.$apply(function () {
               $scope.userDictionary[obj.get('id')] = {"displayName": obj.get('displayName'), "picture": obj.get('picture')};
             });
           }
         });
       }
       markRead();
     }else{
       $scope.notification = true;
     }
   });

   // An alert dialog
  $scope.showAlert = function(id, data) {
    var htmlText = '<span><strong class="text-primary">'+($scope.userDictionary[id].displayName || $scope.defaultName)+'</strong>&nbsp;'+data+'</span>';
    var alertPopup = $ionicPopup.alert({
      title: 'Notification',
      template: htmlText
    });
    alertPopup.then(function(res) {

    });
  };

  $scope.post = function(notification){
    if(notification.document.post)
      $state.go('app.post', {'id': notification.document.post.document._id, 'type':'feed'});
    else if(notification.document.groupPost)
      $state.go('app.post', {'id': notification.document.groupPost.document._id, 'type':'group'});
  };
})
.controller('PostCtrl', function($rootScope, $scope, $state, $ionicModal, $stateParams, $timeout, Account, Rating, FeedService){
  $scope.ownIt=[];
  $scope.defaultName = "Anonymous";
  $scope.defaultPicture = "img/profile.png";
  $scope.rating = function(data){
    if(data){
      if(data.post > 0){
        if(data.closed > 0){
          return "Closed "+data.closed+' | '+"Opened "+data.post;
        }else{
          return "New Seller";
        }
      }
      return "New Seller";
    }else{
      return "New Seller";
    }
  };

  $scope.ratingBuyer = function(data){
    if(data){
      if(data.bought > 0){
        if(data.accepted > 0){
          return data.accepted+'/'+data.bought;
        }else{
          return "New Buyer";
        }
      }
      return "New Buyer";
    }else{
      return "New Buyer";
    }
  };

  if(!$rootScope.userProfile){
    Account.getProfile()
      .success(function(data) {
        $scope.user = data;
        $rootScope.userProfile = CB.fromJSON(data);
      })
      .error(function(error) {

      });
  }else{
     $scope.user = $rootScope.userProfile;
  }

  $scope.startChat = function(userId){
    $state.go('app.chat', {'userId': userId});
  };

  FeedService.post($stateParams.id, $stateParams.type)
    .success(function(data){
      if(data){
        rankData = {"post":data.document.post,"closed":data.document.closed};
        data.document.rate = $scope.rating(rankData);
        $scope.post = data;
        FeedService.ownIt([data]).then(function(object){
          if(object[0])
              $scope.ownIt[object[0].document.feed.document._id] = object[0];
        });
      }else{

      }
    }).error(function(error){

    });

    $scope.timeConversion = function(time){
      return moment(time).unix();
    };
})
.controller('MessagesCtrl', function($rootScope, $scope, $state, $ionicModal, $stateParams, $timeout, Account, Rating){
   $scope.chatMembers = [];
   $scope.countPerUser = [];
   $scope.chatHistory = [];
   $scope.chatUserList = [];
   $scope.messageCount = [];
   $scope.userList=[];
   $scope.chatWindow = false;
   $scope.noMessage = false;
   var activeUser = 0;
   $scope.defaultPicture = "img/profile.png";
   if(!$rootScope.userProfile){
    Account.getProfile()
      .success(function(data) {
        $scope.user = data;
        $rootScope.userProfile = CB.fromJSON(data);
        $scope.cbUserOuery = new CB.CloudQuery('User');
        $scope.cbUserOuery.get($scope.user.document._id, {
          success: function(obj){
            $scope.currentUser = obj;
            if(!obj.document.group)
              window.location.href = "/#/wizard";
              //  $scope.getUnReadMessageCount();
            $scope.getChatHistory();
          }
        });
      })
      .error(function(error) {

      });
  }else{
    $scope.user = $rootScope.userProfile;
    $scope.cbUserOuery = new CB.CloudQuery('User');
    $scope.cbUserOuery.get($scope.user.document._id, {
      success: function(obj){
        $scope.currentUser = obj;
        if(!obj.document.group)
          $state.go('app.wizard');
          //  $scope.getUnReadMessageCount();
        $scope.getChatHistory();
      }
    });
  }

  $scope.activeUser = function(userArray){
    var query = new CB.CloudQuery('onlineUser');
    query.equalTo('status', 'online');
    var userObjectArray = [];

    query.find({
      success: function(user){
        if(user.length>0){
          for (var i = 0; i < user.length; i++) {
            var now = moment();
            var difference = now.diff(user[i].get('lastActive'), 'seconds');
              $rootScope.activeUserList[(user[i].get('user')).document._id] = true;
            if(difference > 60){
                $rootScope.activeUserList[(user[i].get('user')).document._id] = false;
            }
          }
          console.log($rootScope.activeUserList);
        }
      }
    });
  };

  $scope.getChatHistory = function(){
    var members;
    $scope.chatHistory = [];
    var cbQuery1 = new CB.CloudQuery('Chat');
    var cbQuery2 = new CB.CloudQuery('Chat');
    cbQuery1.equalTo('to', $scope.currentUser);
    cbQuery1.setLimit(70);
    cbQuery1.selectColumn('from');
    cbQuery1.distinct('from',{
      success: function(chatHistory){
          $scope.chatHistory = _.pluck(chatHistory, 'document');
          cbQuery2.equalTo('from', $scope.currentUser);
          cbQuery2.setLimit(50);
          cbQuery2.selectColumn('to');
          cbQuery2.distinct('to', {
            success: function(obj){
              $scope.$apply(function () {
                var to = _.pluck(obj, 'document');
                for(var i=0; i<to.length; i++){
                  $scope.chatHistory.push(to[i]);
                }

                var chatMembers1 = _.pluck($scope.chatHistory, 'from');
                var chatMembers2 = _.pluck($scope.chatHistory, 'to');
                for(var i=0; i<chatMembers2.length; i++){
                  chatMembers1.push(chatMembers2[i]);
                }
                chatMembers1.push($scope.currentUser);
                $scope.chatMembers = _.pluck(chatMembers1, 'document');
                $scope.chatMembers = _.pluck($scope.chatMembers, '_id');
                $scope.chatMembers = _.uniq($scope.chatMembers);
                $scope.chatMembers = _.filter($scope.chatMembers, Boolean);
              });

              $scope.activeUser($scope.chatMembers);
              var query = new CB.CloudQuery('User');
              for(var i=0; i < $scope.chatMembers.length;i++){
                query.get($scope.chatMembers[i], {
                  success: function(obj){
                    var sellerData = {"post":obj.document.post,"closed":obj.document.closed};
                    var buyerData = {"bought": obj.document.bought, "accepted":obj.document.accepted};
                    $scope.chatUserList[obj.get('id')] = {"id":obj.get('id'),"displayName": obj.get('displayName'), "picture": obj.get('picture'), "seller":Rating.rating(sellerData),"buyer":Rating.ratingBuyer(buyerData)}
                    $scope.$apply(function () {
                      $scope.userList[obj.get('id')] = $scope.chatUserList[obj.get('id')];
                    });
                  }
                });
              }
              if($scope.chatMembers.length <=1){
                $scope.chatWindow = false;
                $scope.noMessage = true;
              }else{
                $scope.chatWindow = true;
                $scope.noMessage = false;
              }
              $scope.$apply(function () {
                $scope.chatMembers.pop();

              });
              $scope.getUnReadChatCountPerUser();
            }
          });
        /**/
      },
      error: function(err){
        console.log("Message Data :: "+err);
      }
    });
  };

  $scope.markChatRead = function(){
    var cbQuery = new CB.CloudQuery('Chat');
    cbQuery.equalTo('to', $scope.currentUser);
    cbQuery.equalTo('from', $scope.chatUser);
    cbQuery.equalTo('read', false);
    cbQuery.setLimit(50);
    cbQuery.find({
      success: function(objList){
        for(var i=0; i<objList.length; i++){
          objList[i].set('read',true);
          objList[i].save();
        }
          $rootScope.messageCounter -= objList.length;
      },
      error: function(err){

      }
    });
  };

  //unread messages
  $scope.getUnReadMessageCount = function(){
    var cbQuery = new CB.CloudQuery('Chat');
    cbQuery.equalTo('to', $scope.currentUser);
    cbQuery.equalTo('read', false);
    cbQuery.count({
      success: function(count){
        $scope.messageCounter += count;
      }
    });
  };

  $scope.getUnReadChatCountPerUser = function(){
    var j = 0;
    var memberList = _.pluck($scope.members, 'document');
    var cbQuery = new CB.CloudQuery('Chat');
    cbQuery.equalTo('to', $scope.currentUser);
    cbQuery.equalTo('read', false);
    cbQuery.distinct('from',{
      success: function(obj){
        for(var i=0; i<obj.length; i++){
          cbQuery = new CB.CloudQuery('Chat');
          cbQuery.equalTo('to', $scope.currentUser);
          cbQuery.equalTo('from', obj[i].get('from'));
          cbQuery.equalTo('read', false);
          cbQuery.find({
            success: function(countObj){
              $scope.$apply(function () {
                $scope.messageCount[countObj[0].document.from.document._id] = countObj.length;
              });
            },error: function(err){

            }
          });
        }
      }
    });
  };

  $scope.startChatting = function(user, name){
    $state.go('app.chat', {'userId': user, 'name': name});
  };

})
.controller('GroupCtrl', function($rootScope, $scope, $ionicModal, $timeout,  $state, Account, Payment, GroupService, FeedService){
  $scope.defaultPicture = "img/profile.png";
  $scope.feedFromDB=[];
  $scope.feedCount = 0;
  $scope.members =[];
  $scope.professionTagged = [];
  $scope.professionTags = [];
  $scope.professionItems = [];
  $scope.prof = [];
  $scope.currentUser;
  $scope.cbUserQuery;
  $scope.chatUser = new CB.CloudObject('User');
  $scope.cbUserOuery;
  $scope.countPerUser = [];
  $scope.postPending = false;
  $scope.nostream = false;
  $scope.nomember = false;
  $scope.ownIt = [];
  $scope.soldDealStatus = [];
  $scope.soldDeal;
  $scope.pendingFeed=[];
  $scope.spinner = true;
  $scope.dealOperation = [];
  $scope.picFile="";
  $scope.groupName = "";
  
  $scope.countOf = function(text) {
     var s = text ? text.split(/\s+/) : 0; // it splits the text on space/tab/enter
     return s ? s.length : '';
  };
  
  $scope.newPost = function(){
    $state.go('app.newpost', {'type':'group'});
  };
  $scope.rating = function(data){
    if(data){
      if(data.post > 0){
        if(data.closed > 0){
          return "Closed "+data.closed+' | '+"Opened "+data.post;
        }else{
          return "New Seller";
        }
      }
      return "New Seller";
    }else{
      return "New Seller";
    }
  };

  $scope.ratingBuyer = function(data){
    if(data){
      if(data.bought > 0){
        if(data.accepted > 0){
          return data.accepted+'/'+data.bought;
        }else{
          return "New Buyer";
        }
      }
      return "New Buyer";
    }else{
      return "New Buyer";
    }
  };

  Account.getProfile()
    .success(function(data) {
      $scope.user = data;
      $rootScope.userProfile = data;
      $scope.cbUserOuery = new CB.CloudQuery('User');
      $scope.cbUserOuery.get($scope.user.document._id, {
        success: function(obj){
          $scope.currentUser = obj;
          GroupService.groupName(obj.document.location.document._id).then(function(name){
            $scope.groupName = name;
          }).catch(function(err){

          });
        }
      });
    })
    .error(function(error) {

    });

    GroupService.fetch($scope.feedCount)
      .success(function(data){
          if(data.length > 0 ){
            $scope.feedFromDB = data;
            for(var i=0; i<$scope.feedFromDB.length; i++){
              rankData = {"post":$scope.feedFromDB[i].document.post,"closed":$scope.feedFromDB[i].document.closed};
              $scope.feedFromDB[i].document.rate = $scope.rating(rankData);
              $scope.feedFromDB[i].isCollapsed = true;
            }
            GroupService.ownIt(data).then(function(object){
              for (var i = 0; i < object.length; i++) {
                if(object[i].document.groupFeed)
                  $scope.ownIt[object[i].document.groupFeed.document._id] = object[i];
              }
            });
          }else{
            $scope.nostream = true;
          }
      })
      .error(function(err){
        $scope.feedFromDB = [];
        $scope.nostream = true;
      });

      $scope.taggedKeywords = function(item){
          if(item.table == "Profession"){
            $scope.professionTagged.push(item);
          }
          return "@"+item.label;
      };
      
       $scope.loadMore = function(){
        $scope.loadDataStatus = true;
        $scope.feedCount += 5;
        GroupService.fetch($scope.feedCount).success(function(obj){
            for(i=0; i<obj.length; i++){
              rankData = {"post":obj[i].document.post,"closed":obj[i].document.closed};
              obj[i].document.rate = $scope.rating(rankData);
              obj[i].isCollapsed = true;
              $scope.feedFromDB.push(obj[i]);
            }
            FeedService.ownIt(obj).then(function(object){
              for (var i = 0; i < object.length; i++) {
                $scope.ownIt[object[i].document.feed.document._id] = object[i];
                console.log($scope.ownIt);
              }
            });
            var soldFeed = _.pluck(obj, "document");
            soldFeed = _.where(soldFeed, {soldToUser:true});
            $scope.loadDataStatus = false;
          }).error(function(error){
            
          });
      };

      $scope.dealClose = function(feedId, index, post){
        $scope.dealOperation[index] = true;
        var data = {feedId:feedId};
        Payment.close(data, 'group').success(function(msg){
          $scope.dealOperation[index] = false;
          $scope.ownIt[post.document._id].document.dealStatus = "close";
          $state.go('app.balance');
        }).error(function(err){
          $scope.dealOperation[index] = false;
        });
      };

      $scope.refund = function(feedId, index, post){
        $scope.dealOperation[index] = true;
        var transaction = new CB.CloudQuery('buyerStatus');
        var feedObj = new CB.CloudObject('GroupFeed',feedId);
        var userObj = new CB.CloudObject('User',$scope.user.document._id);
        transaction.equalTo('groupFeed',feedObj);
        transaction.equalTo('buyer',userObj);
        transaction.equalTo('dealStatus', 'pending');
        transaction.findOne({
          success: function(transObject){
            if(transObject){
              Payment.refund({"groupfeed":feedObj}).success(function(status){
                $scope.dealOperation[index] = false;
                $scope.feedFromDB[index].document.soldToUser = false;
                $scope.feedFromDB[index].document.user = null;
              }).error(function(err){
                $scope.dealOperation[index] = false;
              });
            }
          },
          error: function(err){
         
          }
        });
      };

      $scope.commit = function(index){
        $scope.feedFromDB[index].committing = true;
        var payload = {
          "groupFeed": $scope.feedFromDB[index].document._id,
          "amount":$scope.feedFromDB[index].document.price
        };
        Payment.commit(payload).success(function(data){
          $scope.feedFromDB[index].committing = false;
          $scope.feedFromDB[index].commitButton= true;
          $state.go('app.success', {'price': $scope.feedFromDB[index].document.price, 'user': data.user.document._id, 'referenceId': data.referenceId});
        }).error(function(err){
          $scope.feedFromDB[index].committing = false;
        });
      };
})
.controller('ChatCtrl', function($rootScope, $scope, $state, $ionicScrollDelegate, $ionicModal, $stateParams, $timeout, Account, Rating){
  $scope.user = $stateParams.name;
  $scope.defaultPicture = "img/profile.png";
  var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
  if($stateParams.userId){
    $scope.chatUser = new CB.CloudObject('User', $stateParams.userId);
    $scope.currentUser = new CB.CloudObject('User', $rootScope.userProfile.document._id);
      startChat($stateParams.userId);
  }
  function startChat(member){
    $scope.chat = member;

    var userQuery = new CB.CloudQuery('User');
    userQuery.get(member, {
      success: function(obj){
        $scope.chatUser = obj;
        var cbChat1 = new CB.CloudQuery('Chat');
        var cbChat2 = new CB.CloudQuery('Chat');
        cbChat1.equalTo('to', $scope.currentUser);
        cbChat1.equalTo('from', $scope.chatUser);
        cbChat2.equalTo('from', $scope.currentUser);
        cbChat2.equalTo('to', $scope.chatUser);
        var cbChat = CB.CloudQuery.or(cbChat1, cbChat2);
        cbChat.setLimit(50);
        cbChat.find({
          success: function(chatList){
            $scope.chatHistory = chatList;

          },
          error: function(){
            console.log(err);
          }
        });
        markChatRead();
      }
    });
  }

  function markChatRead(){
    var cbQuery = new CB.CloudQuery('Chat');
    cbQuery.equalTo('to', $scope.currentUser);
    cbQuery.equalTo('from', $scope.chatUser);
    cbQuery.equalTo('read', false);
    cbQuery.setLimit(50);
    cbQuery.find({
      success: function(objList){
        for(var i=0; i<objList.length; i++){
          objList[i].set('read',true);
          objList[i].save();
        }
          $rootScope.messageCounter -= objList.length;
      },
      error: function(err){

      }
    });
  }

  $scope.saveChatText = function(){
     //$scope.text = $scope.text.replace(/\r?\n/g, '<br />');
     var cbChatObject = new CB.CloudObject('Chat');
     cbChatObject.set('to', $scope.chatUser);
     cbChatObject.set('from', $scope.currentUser);
     cbChatObject.set('message', $scope.text);
     cbChatObject.set('read', false);
     cbChatObject.save({
       success: function(obj){
         if(!obj){
           //unable to save message

         }
       },
       error: function(err){
         //unable to save message
       }
     });
     $scope.text = "";
 };

  $scope.timeConversion = function(time){
    return moment(time).unix();
  };
  //--------------------------------Chat Notification---------------------------------------
    $scope.chatUser = new CB.CloudObject('User', $stateParams.userId);
    CB.CloudObject.on('Chat', 'created', function(obj){
      if((obj.document.to.document._id === $rootScope.userProfile.document._id || obj.document.from.document._id === $rootScope.userProfile.document._id) && (obj.document.from.document._id === $scope.chatUser.document._id || obj.document.to.document._id === $scope.chatUser.document._id)){
        $scope.$apply(function () {
          $scope.chatHistory.push(obj);
        });
        viewScroll.scrollBottom(true);
      }
    });
})
.controller('WizardCtrl', function($rootScope, $scope, $state, $ionicHistory, $ionicModal, $timeout, ProfessionService, LocationService, Account){
  $scope.professionTags = [];
  	$scope.professionItems = [];
    $scope.locationItems = [];
    $scope.locationTags = [];
    $scope.saving=false;
    $scope.locationInputField = false;
    $scope.locationInputValid = false;
    $scope.professionInputField = false;
    $scope.professionInputValid = false;
    $scope.professionCounter = 0;
    $scope.locationCounter = 0;
    $scope.saving=true;
    $scope.disableProfession = false;
    $scope.disableLocation = false;
    $scope.PhonePattern = /^[789]\d{9}$/;
    $scope.userData = false;
  $scope.defaultPicture = "img/profile.png";
  Account.getProfile().success(function(data) {
    $scope.user = CB.fromJSON(data);
    var cbQuery;
    if(data.document.profession){
      cbQuery = new CB.CloudQuery('Profession');
      cbQuery.get(data.document.profession.document._id,{
        success: function(obj){
          $scope.$apply(function () {
            if(obj){
                $scope.disableProfession = true;
            }
            $scope.professionPrimary.push(obj.document);
            $scope.userData = true;
          });
        }
      });
    }else{
      $scope.userData = true;
    }

    if(data.document.location){
      cbQuery = new CB.CloudQuery('Location');
      cbQuery.get(data.document.location.document._id,{
        success: function(obj){

            if(obj){
                $scope.disableLocation = true;
            }
            obj.document.name = obj.get('city')+", "+ obj.get('country');
            $scope.locationPrimary.push(obj.document);

        }
      });
    }

    if(data.document.secondaryProfession && data.document.secondaryProfession.length > 0){
      for(var i=0; i<data.document.secondaryProfession.length ; i++){
        cbQuery = new CB.CloudQuery('Profession');
        cbQuery.get(data.document.secondaryProfession[i].document._id,{
          success: function(obj){

              $scope.professionTagList.push(obj.document);
            }
        });
      }
    }

    if(data.document.secondaryLocation && data.document.secondaryLocation.length > 0){
      for(var i=0; i<data.document.secondaryLocation.length ; i++){
        cbQuery = new CB.CloudQuery('Location');
        cbQuery.get(data.document.secondaryLocation[i].document._id,{
          success: function(obj){

              obj.document.name = obj.get('city')+", "+obj.get('country');
              $scope.locationTagList.push(obj.document);
            }
        });
      }
    }
  }).error(function(error) {
      $scope.userData = true;
  });

  if(!$rootScope.profession){
    ProfessionService.getSource().success(function(list) {
      buildProfessionTags(list);
      $rootScope.profession = CB.fromJSON(list);
    }).error(function(err){

    });
  }else{
    buildProfessionTags($rootScope.profession);
  }

  if(!$rootScope.location){
    LocationService.getSource().success(function(list) {
      buildLocationTags(list);
      $rootScope.location = CB.fromJSON(list);
    }).error(function(err){

    });
  }else{
    buildLocationTags($rootScope.location);
  }

  function buildProfessionTags(obj){
    var list = JSON.parse(obj);
    $scope.professionItems = _.pluck(list, 'document');
    $scope.professionTags = _.pluck($scope.professionItems, 'name');
  }

  function buildLocationTags(obj){
    var list = JSON.parse(obj);
    $scope.locationItems = _.pluck(list, 'document');
    $scope.city = _.pluck($scope.locationItems, 'city');
    $scope.country = _.pluck($scope.locationItems, 'country');
    for(i=0;i<$scope.city.length; i++){
      $scope.locationTags.push($scope.city[i]+', '+$scope.country[i]);
      $scope.locationItems[i].name = ($scope.city[i]+', '+$scope.country[i]);
    }
  }

  $scope.updateProfile = function() {
    $scope.saving=true;
    if($scope.picFile){
      UploadService.imageUpload($scope.picFile).then(function(obj){

        $scope.updateProfileData(obj.document.url);
      }).catch(function(err){
        console.log("error"+ err);
      });
    }else {
      $scope.updateProfileData();
    }
  };

  $scope.updateProfileData = function(url){
    var profileData = {
      displayName: $scope.user.document.displayName,
      profession: $scope.professionPrimary,
      location: $scope.locationPrimary,
      phone: $scope.user.document.phone
    };

    if($scope.professionTagList.length > 0){
        profileData.secondary_profession = $scope.professionTagList;
    }else{
        profileData.secondary_profession = null;
    }

    if($scope.locationTagList.length > 0){
        profileData.secondary_location = $scope.locationTagList;
    }else{
        profileData.secondary_location = null;
    }

    if(url)
      profileData.picture = url;

    var seen = [];
    var data = JSON.stringify(profileData, function(key, val) {
     if (val !== null && typeof val == "object") {
          if (seen.indexOf(val) >= 0) {
              return;
          }
          seen.push(val);
      }
      return val;
    });//JSON.stringify(profileData, null, 2);
    Account.updateProfile(data).then(function() {
        $scope.saving=false;
        $ionicHistory.nextViewOptions({
          disableBack: true
        });
        $state.go('app.requirements');
      }).catch(function(err){
        //console.log();
     });
  };

  $scope.professionTagList = [];
  $scope.professionPrimary = [];
  $scope.loadProfessionTags = function($query) {
    return $scope.professionItems.filter(function(profession) {
      return profession.name.toLowerCase().indexOf($query.toLowerCase()) != -1;
    });
  };
  $scope.professiontagAdded = function(tag){
    $scope.validProfession(tag);
    $scope.professionCounter += 1;
    if($scope.professionCounter > 1){
      $scope.professionInputField = true;
    }else if ($scope.professionCounter > 0) {
      $scope.professionInputField = false;
    }
  };

  $scope.professiontagRemoved = function(tag){

    $scope.professionCounter -= 1;
    if($scope.professionCounter > 1){
      $scope.professionInputField = true;
    }else if ($scope.professionCounter > 0) {
      $scope.professionInputField = false;
      $scope.professionInputValid = false;
    }else{
      $scope.professionInputField = false;
      $scope.professionInputValid = true;
    }
  };

  $scope.validProfession = function(tag){
    var query = new CB.CloudQuery('Profession');
    if(tag._id){
      query.get(tag._id,{
        success: function(object){
          if(object){
            $scope.professionInputValid = false;
          }else{
            $scope.professionPrimary.pop();
            $scope.professionCounter -= 1;
            $scope.professionInputValid = true;
          }
        }
      });
    }else{
      $scope.professionPrimary.pop();
      $scope.professionCounter -= 1;
      $scope.professionInputValid = true;
    }
  };

  $scope.validProfession1 = function(tag){
    var query = new CB.CloudQuery('Profession');
    if(tag._id){
      query.get(tag._id,{
        success: function(object){
          if(object){
            $scope.professionInputValid = false;
          }else{
            $scope.professionTagList.pop();
            $scope.professionCounter -= 1;
            $scope.professionInputValid1 = true;
          }
        }
      });
    }else{
      $scope.professionTagList.pop();
      $scope.professionCounter -= 1;
      $scope.professionInputValid1 = true;
    }

    if(tag.name === $scope.professionPrimary[0].name){
      $scope.professionTagList.pop();
      $scope.professionCounter -= 1;
      $scope.professionInputValid1 = true;
    }
  };

  $scope.locationTagList = [];
  $scope.locationPrimary = [];
  $scope.loadLocationTags = function($query) {
    return $scope.locationItems.filter(function(location) {
      return location.name.toLowerCase().indexOf($query.toLowerCase()) != -1;
    });
  };

  $scope.locationtagAdded = function(tag){
     $scope.validLocation(tag);
     $scope.locationCounter += 1;
     if($scope.locationCounter > 1){
       $scope.locationInputField = true;
     }else if ($scope.locationCounter > 0) {
       $scope.locationInputField = false;
     }
   };

   $scope.locationtagRemoved = function(tag){
     console.log("removed");
     $scope.locationCounter -= 1;
     if($scope.locationCounter > 1){
       $scope.locationInputField = true;
     }else if ($scope.locationCounter > 0) {
       $scope.locationInputField = false;
       $scope.locationInputValid  = false;
     }else{
       $scope.locationInputField = false;
       $scope.locationInputValid  = true;
       console.log("invalid state :: "+ $scope.userForm.location.$invalid);
     }
   };
   $scope.validLocation = function(tag){
    //check user input validatity
    var index = _.indexOf($scope.locationTags, tag.name);
    if(index < 0){
      console.log("Invalid location "+ tag.name);
      $scope.locationPrimary.pop();
      $scope.locationCounter -= 1;
      $scope.locationInputValid  = true;
    }else{
      $scope.locationInputValid  = false;
    }
  };

  $scope.validLocation1 = function(tag){
    //check user input validatity
    var index = _.indexOf($scope.locationTags, tag.name);
    if(index < 0){
      console.log("Invalid location "+ tag.name);
      $scope.locationTagList.pop();
      $scope.locationCounter -= 1;
      $scope.locationInputValid1  = true;
    }else{
      $scope.locationInputValid1  = false;
    }

    if(tag.name === $scope.locationPrimary[0].name){
      console.log("Invalid location "+ tag.name);
      $scope.locationTagList.pop();
      $scope.locationCounter -= 1;
      $scope.locationInputValid1  = true;
    }
  };

})
.controller('InviteCtrl', function($scope, $cordovaContacts, $cordovaSms){
 
  $scope.getContacts = function() {
    $scope.phoneContacts = [];
    function onSuccess(contacts) {
      for (var i = 0; i < contacts.length; i++) {
        var contact = contacts[i];
        $scope.phoneContacts.push(contact);
      }
    };
    
    function onError(contactError) {
      alert(contactError);
    };
    var options = {};
    options.multiple = true;
    $cordovaContacts.find(options).then(onSuccess, onError);
  };
  
  $scope.sendSMS = function(number){
    var text="Your friend invited you to join Fyipe: click here to join http://fyipe.com";
    var options = {};
		$cordovaSms.send(number.toString(), text, options).then(function() {
        alert('Invitation Sent');
      }, function(error) {
        // An error occurred
		    //alert('not sent');
      });
  }; 
  $scope.getContacts();
})
.controller('PlaylistCtrl', function($scope, $stateParams) {
});
