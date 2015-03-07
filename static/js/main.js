app = angular.module('revco', ["ngRoute"]);

app.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: '/partials/home.html',
				controller: 'MainCtrl'
			}).
			when('/view/:project', {
				templateUrl: '/partials/view_project.html'
			}).
			when('/explore', {
				templateUrl: '/partials/explore.html'
			}).
			when('/make', {
				templateUrl: '/partials/make.html'
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
		token: localStorage["token"],
		changeUsername: function(username) {
			service.username = username;
			$rootScope.$broadcast('user.update')
		},
		changeToken: function(token) {
			service.token = token;
			$rootScope.$broadcast('user.update')
		},
		loggedIn: function() {
			console.log(service.token)
			return service.token != undefined && service.token != "" && service.token != "undefined"
		},
		auth: function(method, username, password, email, error) {
			console.log(username, password, email);
			error = error || function(m) {console.log(m)}
			var url = '/api/user/' + method + "?username=" + username + "&password=" + password + "&email=" + email;
			console.log(url);
			$http.post(url).
				success(function(data) {
					console.log(data)
					if (data.status.error) {
					 	error(data.status.message)
						return	
					}
					
					if (data.data.username !== undefined) {
						error("Login with your fresh account!")
						$location.path('/login')
						return
					}

					localStorage["token"] = data.data;
					service.changeToken(data.data);
					$location.path("/");
					
					service.info();
				}).
				error(function(data) {
					console.log(data);
				})
		},
		info: function() {
			console.log("in info", service.token)
			$http.get('/api/user?access_token=' + service.token).
				success(function(data) {
					console.log(data);
					service.token = undefined;
					if (data.status.error) {
						$location.path("/login");
						return 
					}

					service.changeUsername(data.data.username)
				}).
				error(function(data) {console.log("Unable to get user :/")});
		}
	};

	return service;
})

app.controller('MainCtrl', function($scope, User) {
	$scope.$on('user.update', function(event) {
		$scope.message = User.username;
	});
	$scope.message = User.username;

	$scope.change = function() {
		User.changeUsername("boo I liked that username!")
	}
});

app.controller('AuthCtrl', function($scope, $routeParams, $http, $location, User) {
	if(User.loggedIn()) {
		$location.path("#/")
		return
	}

	$scope.method = $routeParams["method"]
	$scope.email = " "

	$scope.other = function() {
		return $scope.method == "login" ? "register" : "login"
	}

	$scope.go = function() {
		console.log($scope.email)
		username = $scope.username;
		password = $scope.password;
		email = $scope.email;

		if (username == "" || username == undefined) {
			$scope.setError("You are *going* to need a username, trust me")	
			return
		}

		if (password == "" || password == undefined) {
			$scope.setError("You need a password to login!")
			return
		}

		if ((email == "" || email == undefined) && $scope.method == "register") {
			$scope.setError("You need an email!")
			return
		}
		User.auth($scope.method, $scope.username, $scope.password, $scope.email, $scope.setError);
	}

	$scope.setError = function(error) {
		$scope.error = error;
	}
})

app.controller('HeaderCtrl', function($scope, $location, $http, User) {
	$scope.$on('user.update', function(event) {
		$scope.user = User;
	});

	if(!User.loggedIn()) {
		$location.path("/login");
		return
	};

	User.info()

	$scope.user = User;
});
