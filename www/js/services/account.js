angular.module('fyipe.services', [])
  .factory('Account', function($http) {
    return {
      getProfile: function() {
        return $http.get(fyipeUrl+'/api/me');
      },
      updateProfile: function(profileData) {
        return $http.put(fyipeUrl+'/api/me', profileData);
      },
      userAccount: function(userId){
        var defer = $q.defer();
        var query = new CB.CloudQuery('User');
        query.containedIn('_id', userId);
        query.find({
          success: function(user){
            defer.resolve(user);
          },
          error: function(err){
            defer.reject(err);
          }
        });
        return defer.promise;
      }
    };
  })
  .factory('SocialLogin', function($http, $q) {
    return {   
      userAccount: function(profile, type){
        var socialMedia = "";
        var profileId = "";
        var email = "";
        var picture = "";
        var name = "";
        
        if(type === "facebook"){
          
          socialMedia = "facebook";
          profileId = profile.id;
          email = profile.email;
          name = profile.name; 
          picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
          
        }else if(socialMedia === "google"){
          
          socialMedia = "google";
          profileId = profile.sub;
          email = profile.email;
          picture = profile.picture.replace('sz=50', 'sz=200');
          name = profile.name;
          
        }else if(socialMedia === "linkedIn"){
          
          socialMedia = "linkedin";
          profileId = profile.id;
          email = profile.emailAddress;
          picture = profile.pictureUrl;
          name = profile.firstName + ' ' + profile.lastName;
          
        }else{
          
          var dummyMail = 'randomemail'+ Math.floor((Math.random() * 1000000) + 1000)+'@gmail.com';
          socialMedia = "twitter";
          profileId = (profile.id).toString();
          email = dummyMail;
          picture = profile.profile_image_url.replace('_normal', '');
          name = profile.name;
          
        }
        
        var defer = $q.defer();
        var cbquery = new CB.CloudQuery('User');
        cbquery.equalTo(socialMedia.toString(), profileId);
        cbquery.find({
          success: function(obj){
        		if(obj.length > 0){
              var token = "";
        			if(!obj[0].document.group)
                defer.resolve({ token: token, wizard: true, id: obj[0].get('id'), name: obj[0].get('displayName'), email: obj[0].get('email') });
		          defer.resolve({ token: token, wizard: false, id: obj[0].get('id'), name: obj[0].get('displayName'), email: obj[0].get('email') });
        		}

        		var cbuser = new CB.CloudObject('User');
        		cbuser.set('username', email);
        		cbuser.set('email', email);
        		cbuser.set('password', '2zBIht@mePh<1Rf'); //dummy password
        		cbuser.set(socialMedia.toString(), profileId);
        		cbuser.set('picture', picture);
				    cbuser.set('displayName', name);
            cbuser.set('balance', 0);

            cbuser.set('post', 0);
            cbuser.set('sold', 0);
            cbuser.set('closed', 0);
            cbuser.set('bought', 0);
            cbuser.set('accepted', 0);
				    cbuser.save({
					      success: function(user) {
						        //Registration successfull
        						var token = "";
        			      defer.resolve({ token: token, wizard: true });
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
                           
                            defer.resolve({ token: token, wizard: false, id: obj.get('id'), name: profile.name, email: profile.email });
                          },
                          error: function(err){
                            console.log(err);
                            defer.reject({message: 'Oops!! somthing went wrong while logging in..'});
                          }
                        });
                      }else {
                        console.log(err);
                        defer.reject({message: 'Oops!! somthing went wrong while logging in..'});
                      }
                    },
                    error: function(err){
                      defer.reject();
                    }
                  });
      						defer.reject();
      					}
      				});
        	},
        	error: function(err){
        		defer.reject();
        	}
        });
        return defer.promise;
      }
    };
  })
  .factory('Token', function($http) {
    return {   
      createJWT: function(userId){
        return $http.get(fyipeUrl+'/jwt/token/'+userId);
      }
    }
  })
  .factory('FeedService', function($http, $rootScope, $q) {
    return {
      fetch: function(count) {
        return $http.get(fyipeUrl+'/feed/fetch/'+count);
      },
      save: function(feedData) {
        return $http.post(fyipeUrl+'/feed/save', feedData);
      },
      notification: function(){
        return $http.get(fyipeUrl+'/feed/notification');
      },
      pendingDeal: function(type){
        return $http.get(fyipeUrl+'/feed/pending/'+type);
      },
      soldDeal: function(type){
        var defer = $q.defer();
        var query;
        if(type==='feed'){
          query = new CB.CloudQuery('Feed');
        }else{
          query = new CB.CloudQuery('GroupFeed');
        }
        var user = new CB.CloudObject('User', $rootScope.userProfile.document._id);
        query.equalTo('user', user);
        query.include('user');
        query.exists('buyer');
        query.setLimit(20);
        query.orderByDesc('updatedAt');
        query.find({
          success: function(feed){
            var soldDeal = [];
            for (var i = 0; i < feed.length; i++) {
                var member = feed[i].get('buyer');
                if(member.length > 0){
                    soldDeal.push(feed[i]);
                }
            }
            defer.resolve(soldDeal);
          },
          error: function(err){
            defer.reject(err);
          }
        });
        return defer.promise;
      },
      soldDealStatus: function(feedId, group){
        var defer = $q.defer();
        var type;
        var query = new CB.CloudQuery('buyerStatus');
        var feed;
        if(!group){
          feed = new CB.CloudObject('Feed', feedId);
          type = 'feed';
        }else{
          feed = new CB.CloudObject('GroupFeed', feedId);
          type = 'groupFeed';
        }
        query.include('buyer');
        query.equalTo(type, feed);
        query.find({
          success: function(data){
            defer.resolve(data);
          }
        });
        return defer.promise;
      },
      ownIt: function(feed){
        var defer = $q.defer();
        var list = [];
        for (var i = 0; i < feed.length; i++) {
          if(feed[i].document.soldToUser){
            var feedObj = new CB.CloudObject('Feed', feed[i].document._id);
            list.push(feedObj);
          }
        }
        var query = new CB.CloudQuery('buyerStatus');
        var buyer = new CB.CloudObject('User', $rootScope.userProfile.document._id);
        query.equalTo('buyer', buyer);
        query.containedIn('feed', list);
        query.notEqualTo('dealStatus','cancelled');
        query.find({
          success: function(status){
            defer.resolve(status);
          }
        });
        return defer.promise;
      },
      post: function(id, type){
        return $http.get(fyipeUrl+'/feed/fetch/'+id+'/'+type);
      },
      search: function(data){
        return $http.get(fyipeUrl+'/feed/search/feed/'+data);
      },
      boughtDeals: function(type, skipCount){
        var defer = $q.defer();
        var attribute;
        var query;
        if(type === "feed"){
          query = new CB.CloudQuery('Feed');
          attribute = 'feed';
        }else{
          query = new CB.CloudQuery('GroupFeed');
          attribute = 'groupFeed';
        }
        var transaction = new CB.CloudQuery('buyerStatus');
        var user = new CB.CloudObject('User', $rootScope.userProfile.document._id);
        transaction.equalTo('dealStatus', 'close');
        transaction.equalTo('buyer', user);
        transaction.include('buyer');
        transaction.exists(attribute);
        transaction.setLimit(5);
        transaction.setSkip(skipCount);
        transaction.find({
          success: function(obj){
            if(obj.length>0){
              var feed=[];
              for(var i=0; i<obj.length; i++){
                if(obj[i].get(attribute))
                   feed.push((obj[i].get(attribute)).document._id);
              }
              query.containedIn('_id', feed);
              query.include('user');
              query.find({
                success: function(data){
                  defer.resolve(data);
                }
              });
            }else{
              defer.resolve(obj);
            }
          },
          error: function(err){
            defer.reject(err);
          }
        });
        return defer.promise;
      },
      postByMe: function(type, skipCount){
        var defer = $q.defer();
        var feedQuery;
        if(type==='feed'){
          feedQuery = new CB.CloudQuery('Feed');
        }else{
          feedQuery = new CB.CloudQuery('GroupFeed');
        }
        var user = new CB.CloudObject('User', $rootScope.userProfile.document._id);
        feedQuery.equalTo('user', user);
        feedQuery.orderByDesc('createdAt');
        feedQuery.setLimit(5);
        feedQuery.orderByDesc('createdAt');
        feedQuery.setSkip(skipCount);
        feedQuery.find({
          success: function(feed){
            defer.resolve(feed);
          },
          error: function(err){
            defer.reject(err);
          }
        });
        return defer.promise;
      },
      sentTo: function(feedId, index){
        return $http.get(fyipeUrl+'/sentto/'+feedId+"/"+index);
      },
      seenBy: function(feedId, index){
        return $http.get(fyipeUrl+
          '/seenby/'+feedId+"/"+index);
      }
    };
  })

  .factory('ProfessionService', function($http) {
    return {
      getSource: function() {
        return $http.get(fyipeUrl+'/api/profession',{ cache: true});
      }
    };
  })

  .factory('LocationService', function($http) {
    return {
      getSource: function() {
        return $http.get(fyipeUrl+'/api/location',{ cache: true});
      }
    };
})
.factory('User', function($http, $q) {
    return{
        add: function(feedId, comment, type, userId){
            var defer = $q.defer();
            var object = new CB.CloudObject('ReportSpam');
            var user = new CB.CloudObject('User', userId);
            var feed;

            if(type === 'feed'){
                feed = new CB.CloudObject('Feed', feedId);
                object.set('feed', feed);
            }else{
                feed = new CB.CloudObject('GroupFeed', feedId);
                object.set('groupFeed', feed);
            }

            object.set('user', user);
            object.set('comment', comment);
            object.save({
                success:function(object){
                    defer.resolve(object);
                },
                error: function(err){
                    defer.reject(err);
                }
            });
            return defer.promise;
        },
        professionInfo:function(id){
          var defer = $q.defer();
          var profession = new CB.CloudQuery('Profession');
          profession.findById(id,{
            success: function(data){
              defer.resolve(data);
            },error: function(err){
              defer.reject(err);
            }
          });
          return defer.promise;
        },
        locationInfo: function(id){
          var defer = $q.defer();
          var location = new CB.CloudQuery('Location');
          location.findById(id,{
            success: function(data){
              defer.resolve(data);
            },error: function(err){
              defer.reject(err);
            }
          });
          return defer.promise;
        }
    };
})
.factory('Rating', function($http, $q, $rootScope){
  return{
    rating: function(data){
      if(data){
        if(data.post >= 0){
          if(data.closed >= 0){
            return (data.closed+'/'+data.post);
          }else{
            return "New Seller";
          }
        }
        return "New Seller";
      }else{
        return "New Seller";
      }
    },

    ratingBuyer: function(data){
      if(data){
        if(data.bought >= 0){
          if(data.accepted >= 0){
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
  };
}).factory('Payment', function($http, $q, $rootScope){
  return {

    commit: function(data){
      return $http.post(fyipeUrl+'/commit', data);
    },
    refund: function(feed){
      return $http.post(fyipeUrl+'/deal/refund', feed);
    },
    close: function(feedId, type){
      //return $http.post('https://test.payu.in/api/v2_1/orders/'+paymentId+'/refund', data, {headers: { 'Content-Type': 'application/x-www-form-urlencoded;', 'Access-Control-Allow-Credentials':'true;', 'Access-Control-Allow-Origin':'*;'}});
      return $http.post(fyipeUrl+'/deal/close/'+type, feedId);
    },
    withdraw: function(data, amount){
      var defer = $q.defer();
      var object = new CB.CloudObject('withdrawalRequest');
      var user = new CB.CloudObject('User', $rootScope.userProfile.document._id);
      if(amount > parseFloat($rootScope.userProfile.document.balance)){
        defer.reject("Cannot withdraw money more than you have.");
      }else{
        object.set('user', user);
        object.set('amount', amount);
        object.set('bankDetails', data);
        object.save({
          success: function(obj){
              var query = new CB.CloudQuery('User');
              query.get(user.document._id,{
                success: function(object){
                  var amountLeft =
                  object.set('balance',parseFloat($rootScope.userProfile.document.balance) - amount );
                  object.save({
                    success: function(userObject){
                      mixpanel.track('Withdraw', {
                        "Name":data.name,
                        "Account": data.account,
                        "Bank": data.bank,
                        "Branch": data.branch,
                        "IFSC": data.ifsc,
                        "Balance": $rootScope.userProfile.document.balance
                      });
                      defer.resolve(userObject);

                    },error: function(){

                    }
                  });
                },error: function(){

                }
              });
          },
          error: function(err){
            defer.reject(err);
          }
        });
      }
      var query = new CB.CloudQuery('User');
      query.get($rootScope.userProfile.document._id,{
        success: function(userObject){
          userObject.set('bank', data);
          userObject.save();
        }
      });
      return defer.promise;
    }
  };
})
.factory('GroupService', function($http, $rootScope, $q) {
    return {
      fetch: function(count) {
        return $http.get(fyipeUrl+'/group/fetch/'+count);
      },
      members: function(){
        return $http.get(fyipeUrl+'/group/members');
      },
      save: function(feedData){
        return $http.post(fyipeUrl+'/group/save', feedData);
      },
      pendingDeal: function(){
        return $http.get(fyipeUrl+'/feed/pending/group');
      },
      ownIt: function(feed){
        var defer = $q.defer();
        var list=[];
        for (var i = 0; i < feed.length; i++) {
          if(feed[i].document)
            if(feed[i].document.soldToUser){
              var feedObj = new CB.CloudObject('GroupFeed', feed[i].document._id);
              list[i] = feedObj;
            }
        }
        var query = new CB.CloudQuery('buyerStatus');
        var buyer = new CB.CloudObject('User', $rootScope.userProfile.document._id);
        query.equalTo('buyer', buyer);
        //query.equalTo('dealStatus', 'close');
        query.exists('groupFeed');
        query.equalTo('paymentStatus', 'success');
        query.containedIn('groupFeed', list);
        query.find({
          success: function(status){
            defer.resolve(status);
          }
        });
        return defer.promise;
      },
      soldDeal: function(){
        var defer = $q.defer();
        var query = new CB.CloudQuery('GroupFeed');
        var user = new CB.CloudObject('User', $rootScope.userProfile.document._id);
        query.equalTo('user', user);
        query.include('user');
        query.exists('buyer');
        query.orderByDesc('updatedAt');
        query.find({
          success: function(feed){
            var soldDeal = [];
            for (var i = 0; i < feed.length; i++) {
                var member = feed[i].get('buyer');
                if(member.length > 0){
                    soldDeal.push(feed[i]);
                }
            }
            defer.resolve(soldDeal);
          },
          error: function(err){
            defer.reject(err);
          }
        });
        return defer.promise;
      },
      groupName: function(data){
        var defer = $q.defer();
        var query = new CB.CloudQuery('Location');
        query.findById(data,{
          success: function(location){
            defer.resolve(location.document.city);
          },error: function(err){
            defer.reject(err);
          }
        });
        return defer.promise;
      },
      soldDealStatus: function(feedId){
        var defer = $q.defer();
        var query = new CB.CloudQuery('buyerStatus');
        var feed = new CB.CloudObject('GroupFeed', feedId);
        query.include('buyer');
        query.equalTo('groupFeed', feed);
        query.find({
          success: function(data){
            console.log(data);
            defer.resolve(data);
          }
        });
        return defer.promise;
      }
    };
  });
