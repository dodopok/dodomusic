var myApp = angular.module('music', ['angular-loading-bar', 'mediaPlayer']).config(function($httpProvider){
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

myApp.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if(event.which === 13) {
				scope.$apply(function (){
					scope.$eval(attrs.ngEnter);
				});
 
				event.preventDefault();
			}
		});
	};
});
  
myApp.controller('MusicController', ['$scope', '$http', function($scope, $http, $timeout, $cfpLoadingBar) {
	$scope.artist = '';

	$scope.albums = [];
	$scope.playlist = [];
	$scope.album = {};

	$scope.music = {
		picture : 'img/default-album.png',
	};

	$scope.findAlbums = function(artist) {
		$http({method: 'GET', url: 'https://ws.spotify.com/search/1/album.json?q='+encodeURIComponent(artist)}).
		success(function(data, status, headers, config) {
			$scope.albums = data.albums;
			$scope.getCovers();
			$scope.artist = '';		
		});
	}

	$scope.getCover = function(id, callback) {
		return $http.jsonp("https://embed.spotify.com/oembed/?callback=JSON_CALLBACK&alt=json-in-script&url="+encodeURIComponent(id)).success(
			function(value) {
				return callback(value.thumbnail_url.replace('/cover/', '/300/'));
			}
		);
	}

	$scope.getCovers = function () {
		var prom = [];
		$scope.albums.forEach(function (obj, i) {
			obj.picture = 'img/loading-circle.gif';
			prom.push($scope.getCover(obj.href, function(value){
				$scope.albums[i].picture = value;
			}));
		});
	};

	$scope.setAlbum = function(album) {
		$http({method: 'GET', url: 'https://ws.spotify.com/lookup/1/.json?uri='+encodeURIComponent(album.href)+'&extras=track'}).
		success(function(data, status, headers, config) {
			album.tracks = data.album.tracks;

			$scope.album = album;
			$('#albumModal').foundation('reveal', 'open');
		});		
	};

	$scope.playMusic = function(music, artist) {
		$scope.getMusic(music, artist, function(obj){			
			$scope.playlist = [obj];
			$scope.audio1.play();
		});
	};

	$scope.addMusic = function(music, artist) {
		console.debug($scope.audio1);
		$scope.getMusic(music, artist, function(obj){
			$scope.playlist.push(obj);
		});
	};

	$scope.getMusic = function(music, artist, callback) {
		$http({method: 'GET', url: 'http://gdata.youtube.com/feeds/api/videos?q="'+encodeURIComponent(artist+' - '+music)+'"&orderby=relevance&alt=json&max-results=1'}).
		success(function(data, status, headers, config) {
			var ytUrl = data.feed.entry[0].id.$t.replace('http://gdata.youtube.com/feeds/api/videos/', '');
			var musicObj = {
				src : 'http://ytapi.com/api/'+ytUrl+'/direct/171/',
				picture: $scope.album.picture,
			};			

			callback(musicObj);
		});
	};

}]);

var changeTime = true;

// Set max-height the first time
$(document).ready(function() {
	$('#audio1').on('loadeddata', function() 
	{
		this.play();
	});

	$('#musicTime').foundation('slider', 'set_value', 0);

	$("#audio1").bind('timeupdate', function(){

        var track_length = $("#audio1")[0].duration;
        var secs = $("#audio1")[0].currentTime;
        var progress = (secs/track_length) * 100;

        if (changeTime) {
        	$('#musicTime').foundation('slider', 'set_value', progress);
        }

        /*var tcMins = parseInt(secs/60);
        var tcSecs = parseInt(secs - (tcMins * 60));

        if (tcSecs < 10) { tcSecs = '0' + tcSecs; }

        // Display the time
        $('#timecode').html(tcMins + ':' + tcSecs);*/
    });

    $('#musicTime').on('mousedown', function() {
    	changeTime = false;
    });

    $('#musicTime').on('mouseleave', function() {
    	changeTime = true;
    });

    $('#musicTime').on('mouseup.fndtn.slider touchend.fndtn.slider pointerup.fndtn.slider', function(){
		var value = $('#musicTime').attr('data-slider');
		var track_length = $("#audio1")[0].duration;

		var set = track_length*(value/100);
		$("#audio1")[0].currentTime = set;		
	});

    $('.reveal-modal').css('max-height', $('html').height() - 150 + 'px'); // 100 +10px to keep modal effect visible
});

// Reset max-height after window resize
$(window).resize(function() {
    $('.reveal-modal').css('max-height', $('html').height() - 150 + 'px');
});