app = angular.module('gerrycode', ["ngRoute"]);

app.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: '/partials/home.html',
				controller: 'HomeCtrl'
			}).
			when('/me/view', {
				templateUrl: 'partials/my_projects.html',
				controller: 'MyProjectsCtrl'
			}).
			when('/projects/:project', {
				templateUrl: '/partials/view_project.html',
				controller: 'ViewProjectCtrl'
			}).
			when('/projects/:project/settings', {
				templateUrl: '/partials/project_settings.html'
			}).
			when('/projects/:project/flag/:flag', {
				templateUrl: '/partials/feedback.html',
				controller: 'ViewFlagCtrl'
			}).
			when('/projects/:project/flag', {
				templateUrl: '/partials/flag.html',
				controller: 'FlagCtrl'
			}).
			when('/explore', {
				templateUrl: '/partials/explore.html'
			}).
			when('/make', {
				templateUrl: '/partials/make.html',
				controller: 'MakeCtrl'
			}).
			when('/auth/:method', {
				templateUrl: '/partials/login.html',
				controller: 'AuthCtrl'
			}).
			when('/login', {
				redirectTo: '/auth/login'
			}).
			when('/register', {
				redirectTo: '/auth/register'
			}).
			otherwise({
				redirectTo: '/'
			});

	}]);

app.service('User', function($rootScope, $http, $location) {
	var service = {
		username: undefined, 
		token: localStorage.token,
		changeUsername: function(username) {
			service.username = username;
			$rootScope.$broadcast('user.update');
		},
		changeToken: function(token) {
			service.token = token;
            localStorage.token = token;
			$rootScope.$broadcast('user.update');
		},
        logout: function() {
            service.changeToken(undefined);
            $location.path("/login");
        },
		loggedIn: function() {
			console.log(service.token);
			return service.token !== undefined && service.token != "undefined";
		},
		auth: function(method, username, password, email, error) {
			console.log(username, password, email);
			error = error || function(m) {console.log(m);};
			var url = '/api/user/' + method + "?username=" + username + "&password=" + password + "&email=" + email;
			console.log(url);
			$http.post(url).
				success(function(data) {
					console.log(data);
					if (data.status.error) {
					 	error(data.status.message);
						return;	
					}
					
					if (data.data.username !== undefined) {
						error("Login with your fresh account!");
						$location.path('/login');
						return;
					}

					service.changeToken(data.data);
					$location.path("/");
					
					service.info();
				}).
				error(function(data) {
					console.log(data);
				});
		},
		info: function() {
			console.log("in info", service.token);
			$http.get('/api/user?access_token=' + service.token).
				success(function(data) {
					console.log(data);
					var old = service.token;
					service.changeToken(undefined);
					if (data.status.error) {
						$location.path("/login");
						return; 
					}
					service.changeToken(old);
					service.changeUsername(data.data.username);
				}).
				error(function(data) {console.log("Unable to get user :/");});
		}};

	return service;
});

app.directive('rrUsername', function($http) {
    return {
        restrict: 'E',
        scope: {
            uid: "="
        },
        link: function(scope) {
            $http.get("/api/user/" + scope.uid).
                success(function(data) {
                    if (data.status.error) {
                        console.log("Could not get that user.." + scope.feedback.uid);
                        return;
                    }
                    
                    scope.username = data.data.username;
               });
        },
        template: '{{username}}'
    };
});

app.controller('HomeCtrl', function($scope, $http, User) {
    $http.get("/api/top/projects").
        success(function(data) {
            if (data.status.error) {
                console.log("unable to get the top projects");
                return;
            }

            $scope.projects = data.data;
        });
});

app.controller('AuthCtrl', function($scope, $routeParams, $http, $location, User) {
	if(User.loggedIn()) {
		$location.path("#/");
		return;
	}

	$scope.method = $routeParams.method;
	$scope.email = " ";

	$scope.other = function() {
		return $scope.method == "login" ? "register" : "login";
	};

	$scope.go = function() {
		console.log($scope.email);
		username = $scope.username;
		password = $scope.password;
		email = $scope.email;

		if (!username) {
			$scope.setError("You are *going* to need a username, trust me");
			return;
		}

		if (!password) {
			$scope.setError("You need a password to login!");
			return;
		}

		if (!email && $scope.method == "register") {
			$scope.setError("You need an email!");
			return;
		}
		User.auth($scope.method, $scope.username, $scope.password, $scope.email, $scope.setError);
	};

	$scope.setError = function(error) {
		$scope.error = error;
	};
});

app.controller('MakeCtrl', function($scope, $http, $location, User) {
	$scope.make = function() {
		name = $scope.name;
		url = $scope.url;
		tldr = $scope.tldr;
        lang = $scope.language;

		if (!name) {
			return;
		}

		if (!url) {
			return;
		}

		if (!tldr) {
			return;
		}

        if (!lang) {
            return;
        }

		$http.post("/api/project/new?access_token=" + User.token + "&name=" + name + "&url=" + url + "&tldr=" + tldr + "&lang=" + lang).
			success(function(data) {
				if (data.status.error) {
					console.log(data);
					return;
				}
				console.log("done!");
				console.log(data);
				$location.path("/projects/" + data.data.id);
			});
	};
});

app.controller('MyProjectsCtrl', function($scope, $http, User) {
	$http.get("/api/user/projects?access_token=" + User.token).
		success(function(data) {
			if (data.status.error) {
				console.log("Error in projects :/");
				console.log(data);
				return;
			}
			console.log(data);
			$scope.projects = data.data || [];
		}).
		error(function() {
			console.log("Error fetching repositories!");
		});
});

app.controller('HeaderCtrl', function($scope, $location, $http, User) {
	$scope.$on('user.update', function(event) {
		$scope.user = User;
		console.log(User.loggedIn());
	});

	if(!User.loggedIn()) {
		$location.path("/login");
		return;
	}

	User.info();

	$scope.user = User;
});

app.controller('ProjectCtrl', function($scope, $http, User) {
	$http.get("/api/user/projects?access_token=" + User.token).
		success(function(data) {
			if (data.status.error) {
				console.log("COuld not get projects");
				console.log(data);
				return;
			}	

			$scope.projects = data.data;
		});
});

app.controller('ViewProjectCtrl', function($scope, $http, $routeParams, User) {
	$http.get("/api/project/" + $routeParams.project).
		success(function(data) {
			if (data.status.error) {
                console.log(data);
				console.log("Could not get that project....");
				return;
			}

			$scope.project = data.data;
		});

	$http.get("/api/user/" + User.username).
		success(function(data) {
			if (data.status.error) {
				console.log("Could not get that user..");
				return;
			}

			$scope.user = data.data;
			$scope.owner = $scope.user.username == User.username;
		});

	$http.get('/api/project/' + $routeParams.project + '/flags').
		success(function(data) {
			if (data.status.error) {
				console.log("Could not get project flags");
				return;
			}

			$scope.flags = data.data;
		});
});

app.controller('FlagCtrl', function($scope, $http, User, $routeParams, $location) {
	$scope.flag = function() {
        title = $scope.title;
		query = $scope.query;
		if (!query) {
			return;
		}

        if (!title) {
            return;
        }

		$http.post('/api/project/' + $routeParams.project +'/flags/new?access_token=' + User.token + '&query=' + query + '&title=' + title).
			success(function(data) {
				console.log(data);
				$location.path("/projects/" + $routeParams.project + "/flag/" + data.data.id);
			});
	};
});

app.controller('ViewFlagCtrl', function($scope, $http, $routeParams, User) {
	$http.get('/api/project/' + $routeParams.project + '/flags/' + $routeParams.flag + '/feedback').
		success(function(data) {
			if (data.status.error) {
				console.log("could not get all of dat feedback!");
				return;
			}

			$scope.feedbacks = data.data || [];
			console.log($scope.feedbacks);
		});

	$http.get("/api/project/" + $routeParams.project).
		success(function(data) {
			if (data.status.error) {
				console.log("Could not get that project....");
				return;
			}

			$scope.project = data.data;
		});

	$http.get('/api/project/' + $routeParams.project + '/flags/' + $routeParams.flag).
		success(function(data) {
			if (data.status.error) {
				console.log("Unable to get that flag :/");
				return;
			}

			$scope.flag = data.data;
		});

    $scope.feedback = function() {
        console.log("pushing feedbakc");
        var text = $scope.text;
        if (!text) {
            console.log("text not found!");
            return;
        }

        $http.post('/api/project/' + $scope.project.id +'/flags/' + $scope.flag.id + '/feedback/new?text='+ text + '&access_token=' + User.token)
            .success(function(data) {
                if (data.status.error) {
                    console.log(data);
                    return;
                }

                $scope.feedbacks.push(data.data);
                $scope.text = "";
            });
    };

});
