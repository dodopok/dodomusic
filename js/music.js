var myApp = angular.module('music', ['angular-loading-bar']).config(function($httpProvider){
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
	$scope.audio = document.getElementById('audio');
	$scope.audio1 = {};

	$scope.music = {
		picture : 'img/default-album.png',
	};

	$scope.$watch('playlist', function(newVal) {
		if ($scope.playlist.length) {			
	    	if (!$scope.audio.src) {
	    		$scope.audio.src = $scope.playlist[0].src;
	    		$scope.audio.currentTrack = 0;
	    		$scope.audio.play();
	    	}
	    }
	});

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
			$scope.audio.play();
		});
	};

	$scope.addMusic = function(music, artist) {
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
				artist: artist,
				title: music,
			};			

			callback(musicObj);
		});
	};

	$scope.audio.onplay = function() {		
		$scope.music = $scope.playlist[$scope.audio.currentTrack];
		$scope.$apply();
	};

	$scope.audio1.playPause = function() {
		if ($scope.audio.src) {
			if ($scope.audio.paused) {
				$scope.audio.play();
			} else {
				$scope.audio.pause();
			}
		}
	};

	$scope.audio1.prev = function() {
		if ($scope.playlist[$scope.audio.currentTrack-1]) {
			$scope.audio.currentTrack--;
			$scope.audio.src = $scope.playlist[$scope.audio.currentTrack].src;
			$scope.audio.play();
		}
	}

	$scope.audio1.next = function() {
		if ($scope.playlist[$scope.audio.currentTrack+1]) {
			$scope.audio.currentTrack++;
			$scope.audio.src = $scope.playlist[$scope.audio.currentTrack].src;
			$scope.audio.play();
		}
	}

	$scope.audio.onended = function() {
		$scope.audio1.next();
	}

}]);

var changeTime = true;

// Set max-height the first time
$(document).ready(function() {

	$('#musicTime').foundation('slider', 'set_value', 0);

	$("#audio").bind('timeupdate', function(){

        var track_length = $("#audio")[0].duration;
        var secs = $("#audio")[0].currentTime;
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
		var track_length = $("#audio")[0].duration;

		var set = track_length*(value/100);
		$("#audio")[0].currentTime = set;		
	});

    $('.reveal-modal').css('max-height', $('html').height() - 150 + 'px'); // 100 +10px to keep modal effect visible
});

// Reset max-height after window resize
$(window).resize(function() {
    $('.reveal-modal').css('max-height', $('html').height() - 150 + 'px');
});