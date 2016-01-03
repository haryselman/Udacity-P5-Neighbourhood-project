// app.js has two objects: 1) Model and 2) ViewModel
// Model object contains the list of Venues and venue details that we get back from the foursquare api. jQuery is used to to the API call.
// The method createSummaryForVenues created a summary object out of the orriginal response of the foursquare api.
// At the end the createSummaryForVenues function the list of venues get sorted according to a weigted score

var Model = {
    listOfVenues: [],
    getFoursquareVenueList: function() {
        'use strict';
        var self = this;
        // location is city center of Berlin
        var lat = ViewModel.googleMap.centerFocus.lat;
        var lng = ViewModel.googleMap.centerFocus.lng;
        // API call to foursquare. As the app is a sushi finder by default the query includes sushi in the search query. In the app you can filter for the returned sushi places.
        // formally the clientid an secret should never be exposed and this API call should be handled server side. As this is just an exercise for Udacity it is included in the front-end source.
        var foursquareUrl =  'https://api.foursquare.com/v2/venues/search?client_id=Y3O0RZU3Q4KANU2MBAG2FSFRTM4OQSO2SNEXAE20HO4Y3BTT&client_secret=PEMBM4BL3G23LLUOPLE3XRVY14P4OAKBSVLTCJPKDMJ1P3RR&v=20130815&ll=' + lat +',' + lng + '&query=sushi';
        $.ajax({
            url: foursquareUrl,
            dataType: "jsonp",
            success: function(response) {
                'use strict';
                // here we check if there are any results in the search
                if (response.response.venues.length > 0) {
                    self.listOfVenues = response.response.venues;
                    // on success we create a summary object with (computed) data that is used within the app. This summary extends the original object returned from the API
                    self.createSummaryForVenues(self.listOfVenues);
                } else {
                    // if there are no venues found we open a modal window and notify the user
                    ViewModel.notificationHandler.openModal("No results found for your location")
                }
            },
            error: function() {
                // if the api call us unsuccessful we notify the user
                ViewModel.notificationHandler.openModal("Whoops lost connection with Foursquare API")

            }
        });
    },
    // this function creates a summary of (computed) data used inside the app.
    createSummaryForVenues: function(venuesArray) {
        'use strict';
        var self = this;
        for (var i = 0; i < venuesArray.length; i++) {
            venuesArray[i].summary = {
                latlngPosition: {
                    lat: venuesArray[i].location.lat,
                    lng: venuesArray[i].location.lng
                },
                name: venuesArray[i].name,
                street: venuesArray[i].location.formattedAddress[0],
                zipCity: venuesArray[i].location.formattedAddress[1],
                phone: (function(){
                    'use strict';
                    // here we check if the venue has a phone number listed. In some situations this is not the case.
                    if (venuesArray[i].contact.hasOwnProperty('formattedPhone')) {
                        return venuesArray[i].contact.formattedPhone;
                    } else {
                        return "empty";
                    }
                })(i),
                url: (function(){
                    'use strict';
                    // here we check if the venue has a url  listed. In some situations this is not the case.
                    if (venuesArray[i].hasOwnProperty('url')) {
                        return venuesArray[i].url;
                    } else {
                        return "empty";
                    }
                })(i),
                // weighted score is used to order the list. the weigthed score is the number of recommendations devided by number of user unique checkins
                weightedScore: (function(){
                        return venuesArray[i].stats.tipCount / venuesArray[i].stats.usersCount;
                    }
                )(i)
            };
        }
        // after the summary is created with the weighted scores we call this function to sort the list based on the rating
        ViewModel.listObject.sortListOfVenues();
    }
};

//ViewModel contains everything related to managing the data with the view. This includes not only the knockout bindings but also all other objects and functions such as those used for GoogleMaps
var ViewModel = {
    // updateView calls two functions. 1) generates the list content for the search results of foursquare 2) creates the markers for the googleMaps API
    updateView: function(listOfVenues) {
        'use strict';
        var self = this;
        self.listObject.generateListContent(listOfVenues);
        self.googleMap.markerObject.setMarkers(listOfVenues);
    },
    menu: {
        // this nameless fuctions directly runs on loading the object in order for the menu / hamburger menu to become active
        hamburgerMenu: (function(){
            $("#hamburger-menu").click(function() {
                // annimation takes 500ms
                $("#sidebar-menu").toggle(500, "swing", function(){
                });
            });
        }())
    },
    // this objects contains all the knockout databindings as well as a search function which is called from one of the bindings:
    knockOutBindings: {
        // binds a generated list of HTML with venue list items to the page
        htmlVenueList: ko.observable(""),
        // searchTerm info research from the searchBox
        searchTerm: ko.observable(''),
        // function to filter the original venues Object returned from the FS API
        searchForVenues: function() {
            "use strict";
            var self = this;
            if (self.searchTerm == '') {
                // if the searchTerm is empty we update the view with the original venues object returned from teh FS api
                self.updateView(Model.listOfVenues);
            } else {
                // if the searchTerm is not empty  we copy the original venues object, filter it and then update the view by calling the updateView function
                var filteredListOfVenues = Model.listOfVenues.slice();
                filteredListOfVenues = filteredListOfVenues.filter(ViewModel.listObject.filterListOfVenues);
                ViewModel.updateView(filteredListOfVenues);
            }
        }
    },
    notificationHandler: {
        // Modal view to handle user notifications / errors. Used the exampel from: http://www.jacklmoore.com/notes/jquery-modal-tutorial/
        // function below is a nameless function which is executed immediately
        modal: (function(){
            "use strict";
            var
                method = {},
                $overlay,
                $modal,
                $content,
                $close;

            // Center the modal in the viewport
            method.center = function () {
                var top, left;

                top = Math.max($(window).height() - $modal.outerHeight(), 0) / 2;
                left = Math.max($(window).width() - $modal.outerWidth(), 0) / 2;

                $modal.css({
                    top:top + $(window).scrollTop(),
                    left:left + $(window).scrollLeft()
                });
            };

            // Open the modal
            method.open = function (settings) {
                $content.empty().append(settings.content);

                $modal.css({
                    width: settings.width || 'auto',
                    height: settings.height || 'auto'
                });

                method.center();
                $(window).bind('resize.modal', method.center);
                $modal.show();
                $overlay.show();
            };

            // Close the modal
            method.close = function () {
                $modal.hide();
                $overlay.hide();
                $content.empty();
                $(window).unbind('resize.modal');
            };

            // Generate the HTML and add it to the document
            $overlay = $('<div id="overlay"></div>');
            $modal = $('<div id="modal"></div>');
            $content = $('<div id="content"></div>');
            $close = $('<a id="close" href="#">close</a>');

            $modal.hide();
            $overlay.hide();
            $modal.append($content, $close);

            $(document).ready(function(){
                $('body').append($overlay, $modal);
            });

            $close.click(function(){
                method.close();
            });

            return method;
        }()),
        // function that receives notification content and opens the modal window
        openModal: function(content){
            "use strict";
            var self = this;
            self.modal.open({content: content});
        }
    },
    // listObject contains all data and functions needed to manage the venues list on the page
    listObject: {
        // generateListContent generates the HTML list elements <li> and updates the knockout binding so show the list on the page when done with the for loop
        generateListContent: function(obj){
            'use strict';
            var self = this;
            for (var result in obj) {
                var venueSummary = obj[result].summary;
                var listContent;
                listContent += "<li class='venue-item'>";
                listContent += "<h3>" + venueSummary.name + "</h3>";
                listContent += "<p><span>" + venueSummary.street + "<br>" + venueSummary.zipCity;
                (function(){
                    if (venueSummary.phone != "empty"){
                        return listContent += "<br>" + venueSummary.phone + "</span></p>";
                    } else {
                        return listContent += "</span></p>"
                    }
                }());
                listContent += "</li>";
            }
            // inserting the generated html to the page
            ViewModel.knockOutBindings.htmlVenueList(listContent);
            // makeListClickable function makes the list items clickable (sets all the click events)
            self.makeListClickable();
        },
        // this function sorts the list
        sortListOfVenues: function(){
            'use strict';
            var self = this;
            Model.listOfVenues.sort(function(a, b){
                return b.summary.weightedScore - a.summary.weightedScore;
            });
            ViewModel.updateView(Model.listOfVenues);
        },
        // sets the list click events: bouncing the marker when you click on the list element, opens the google infoWindow and highlights the list element and scrolls to it
        makeListClickable: function() {
            'use strict';
            var self = this;
            // used jQuery to make the list items clickable
            $('#venueList').find('li').click(function() {
                // create an index number of the list items
                var indexNumber = $(this).index();
                // bouncing associated marker on google maps
                ViewModel.googleMap.markerObject.bounceMarker(indexNumber);
                // show associated infoWinow on google maps
                ViewModel.googleMap.infoWindowObject.showInfoWindow(indexNumber);
                // function to highlight the clicked list element and scroll to it
                self.highlightListOnClick(indexNumber);
            });
        },
        // function with the filter rule to filter the list based on the search
        filterListOfVenues: function(obj) {
            'use strict';
            var self = this;
            return obj.name.toLowerCase().indexOf(ViewModel.knockOutBindings.searchTerm().toLowerCase()) > -1;
        },
        // function to highlight the clicked list element and scroll to it
        highlightListOnClick: function(i){
            'use strict';
            // using jquery to select the id venuelist <ul>
            var venueListSelect = $('#venueList');
            // removes the active class if any is found so no duplicate list items can be selected
            venueListSelect.find('.active').removeClass('active');
            // .eq(i) is used to select the particular clicked list element and then sets it to active class
            venueListSelect.find('li').eq(i).addClass('active');
            // the list items have a height of 150 pixels. to know how far you need to scroll in the index of the clicked list element is multiplied by 150 pixels
            var listPixelHeight = 150 * i;
            // animated scroll to the clicked list element
            venueListSelect.animate({
                scrollTop: listPixelHeight
                // scroll animation takes 500ms
            }, 500);
        }
    },
    // googleMap object contains all data and functions related to map interactions
    googleMap: {
        // centerFocus object contains object of Berlin. Optional would be to use the html5 Geocode function in maps to update to the user location.
        // But then it is uncertain if 5 results are returned as required, so I have set the location static to that of Berlin.
        centerFocus: {
            lat: 52.511,
            lng: 13.447
        },
        // initiated the map
        initMap: function() {
            var self = this;
            var mapOptions = {
                center: self.centerFocus,
                zoom: 12
            };
            // map gets attached to the #map in the index.html page
            map = new google.maps.Map(document.getElementById('map'), mapOptions);
            // infoWindow is created just once as I also just want one to be open at a time instead of multiple at a time. To keep things efficient I therefore create it just once.
            // if you want to be able to have multiple infowindow's open at a time move the creation of the infoWindow to the infoWindowObject below
            self.infoWindowObject.infoWindow = new google.maps.InfoWindow();
        },
        // markerObject contains all marker interactions
        markerObject: {
            // declate an array of markers
            markerList: [],
            setMarkers: function(listOfVenues) {
                'use strict';
                var self = this;
                // clear the markers if any are already present
                if (typeof self.markerList !== 'undefined' && self.markerList.length > 0) {
                    self.clearMarkers();
                }
                // looping through the venues list to create the marker based on lat lng position
                for (var i = 0; i < listOfVenues.length; i++) {
                    self.markerList.push(new google.maps.Marker({
                        position: listOfVenues[i].summary.latlngPosition,
                        map: map,
                        // sushi styled marker
                        icon: 'assets/images/marker_icon.png'
                    }));
                    // this function sets the click events on the Markers
                    self.setClickEventOnMarkers(i);
                }
            },
            // function that clears all the markers
            clearMarkers: function() {
                'use strict';
                var self = this;
                // loop that removes the markers of the map
                for (var i = 0; i < self.markerList.length; i++) {
                    self.markerList[i].setMap(null);
                }
                // markerList array is emptied again
                self.markerList = [];
                // if any infoWindow boxes were open, they will be closed now. Would be would to clear all the markers but keep showing the infoWindow popout
                ViewModel.googleMap.infoWindowObject.infoWindow.close();
            },
            // this function sets the click events the markers: bouncing the marker when you click on the marker, opens the google infoWindow and highlights the list element and scrolls to it when clicked.
            setClickEventOnMarkers: function(i) {
                'use strict';
                var self = this;
                self.markerList[i].addListener('click', function() {
                    'use strict';
                    // bounces the marker when clicked
                    self.bounceMarker(i);
                    // shows the infoWindow when clicked
                    ViewModel.googleMap.infoWindowObject.showInfoWindow(i);
                    // highlights the associated list element and scrolls to it when clicked.
                    ViewModel.listObject.highlightListOnClick(i);
                })
            },
            // function that bounces the marker three times
            bounceMarker: function(i) {
                'use strict';
                var self = this;
                // first stops the animated when it is already animating
                if (self.markerList[i].getAnimation() !== null) {
                    self.markerList[i].setAnimation(null);
                }
                // sets the bounce annimation and bounces for 2130ms which is 3 times
                self.markerList[i].setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function(){
                    self.markerList[i].setAnimation(null);
                }, 2130);
            }
        },
        // infoWindowObject contains the function to create the infoWindow content and displays it on screen
        infoWindowObject: {
            infoWindow: {},
            showInfoWindow: function(i) {
                'use strict';
                var self = this;
                // below the HTML is generated for the infoWindow
                var venueSummary = Model.listOfVenues[i].summary;
                var infoWindowContent = "<h3>" + venueSummary.name + "</h3>";
                // nameless function to generate the URL html when a URL is not empty
                (function(){
                    if (venueSummary.url != "empty"){
                        return infoWindowContent += "<a href='" + venueSummary.url + "' target='_blank'>Website</a>";
                    }
                }());
                infoWindowContent += "<p class='black-font'><span>" + venueSummary.street + "<br>" + venueSummary.zipCity;
                // nameless function to generate the phone number html when a phone number is not empty
                (function(){
                    if (venueSummary.phone != "empty"){
                        return infoWindowContent += "<br>" + venueSummary.phone + "</span></p>";
                    } else {
                        return infoWindowContent += "</span></p>"
                    }
                }());
                infoWindowContent += "</li>";
                // function sets the HTML content to the infoWindow
                self.infoWindow.setContent(infoWindowContent);
                // sets the position of the infoWindow which is equal to the venue / marker
                self.infoWindow.setPosition(venueSummary.latlngPosition);
                // closes the infoWindow if any was open to avoid multiple infoWindows being open at the same time
                self.infoWindow.close();
                // opens the infoWindow
                self.infoWindow.open(map);
            }
        }
    }
};
// initiate the KO bindins
ko.applyBindings(ViewModel.knockOutBindings);
// calls the foursquare API
Model.getFoursquareVenueList();