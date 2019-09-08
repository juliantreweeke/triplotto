<template>
  <div id="app">
    <h1>Trip Planner</h1>
    <h3>Origin:{{origin}}</h3>

    <input v-model="origin" placeholder="your origin" />
    <select v-model="selectedOrigin">
      <option
        v-bind:key="index"
        v-for="(place, index) in suggestedOrigins[0]"
        v-bind:value="place.PlaceName"
      >{{place.PlaceName}},{{place.CountryName}}</option>
    </select>
    <br />

    <input v-model="destination" placeholder="your destination" />
    <select v-model="selectedDestination">
      <option
        v-bind:key="index"
        v-for="(place, index) in suggestedDestinations[0]"
        v-bind:value="place.PlaceName"
      >{{place.PlaceName}},{{place.CountryName}}</option>
    </select>
    date:{{flightDate}}
    <datepicker v-model="flightDate" :format="customFormatter" name="datePicker">Date</datepicker>

    <button
      v-on:click="searchLiveFlights(originCityCode,destinationCityCode,flightDate)"
    >Find your next trip</button>
    <Results v-bind:sortedResults="this.sortedResults" />
  </div>
</template>

<script>
import Results from "./components/Results.vue";
import config from "../config.js";
import _ from "lodash";
import Datepicker from "vuejs-datepicker";
import moment from "moment";

const cityCodes = require("../utils/cityCodes2.json");

export default {
  name: "app",
  data() {
    return {
      flightDate: "",
      origin: "",
      destination: "",
      results: [],
      sortedResults: [],
      suggestedOrigins: [],
      suggestedDestinations: [],
      selectedOrigin: "",
      selectedDestination: "",
      originCityCode: "",
      destinationCityCode: ""
    };
  },
  watch: {
    origin: function() {
      this.debouncedAutoSuggestPlaces(this.origin, this.suggestedOrigins);
    },
    destination: function() {
      this.debouncedAutoSuggestPlaces(
        this.destination,
        this.suggestedDestinations
      );
    },
    // when select dropdown changes, get the city Id code and run the sky scanner fetch request with the code
    selectedOrigin: function() {
      this.originCityCode = this.findCityCode(
        this.selectedOrigin,
        this.suggestedOrigins
      );
    },
    selectedDestination: function() {
      this.destinationCityCode = this.findCityCode(
        this.selectedDestination,
        this.suggestedDestinations
      );
    }
  },

  created: function() {
    this.debouncedAutoSuggestPlaces = _.debounce(function(query, target) {
      this.autoSuggestPlaces(query, target), 500;
    });
  },

  methods: {
    findCityCode: function(query, array) {
      const selectedCityCode = array.find(place => place.PlaceName === query)
        .PlaceId;
      return selectedCityCode;
    },
    searchLiveFlights: function(origin, destination, flightDate) {
      // TODO only search if there is no duplication in destination
      // if(sortResults.some)
      console.log(flightDate);
      debugger;
      // if (originCityCode && destinationCityCode) {
      if (!origin && !destination && !flightDate) {
        debugger;
        return;
      }

      fetch(
        "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/pricing/v1.0",
        {
          method: "POST",
          headers: {
            "Access-Control-Expose-Headers": "Location",
            "x-rapidapi-host":
              "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
            "x-rapidapi-key": config.RAPIDAPI_SKY_KEY,
            Accept: "application/json",
            "content-type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            country: "US",
            currency: "USD",
            locale: "en-US",
            originPlace: origin,
            destinationPlace: destination,
            outboundDate: flightDate,

            // outboundDate: "2019-09-22",
            adults: "1"
          })
        }
      )
        .then(response => {
          if (response.status === 429) {
            alert("please try again in a minute");
            return;
          }
          if (response.status === 400) {
            alert("no results");
            return;
          }

          const location = response.headers.get("Location");
          if (location) {
            const sessionKey = location.split("/").pop();
            this.pollLiveFlights(sessionKey);
          }
        })
        .catch(err => {
          console.log(err);
        });
    },

    pollLiveFlights: function(sessionKey) {
      fetch(
        `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/pricing/uk2/v1.0/${sessionKey}?pageIndex=0&pageSize=10`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-host":
              "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
            "x-rapidapi-key": config.RAPIDAPI_SKY_KEY
          }
        }
      )
        .then(response => {
          if (response.status !== 200) {
            console.log(
              "Looks like there was a problem. Status Code: " + response.status
            );
            return;
          }
          response.json().then(data => {
            this.sortResults(data);
          });
        })
        .catch(err => {
          console.log(err);
        });
    },

    sortResults: function(data) {
      const { Places, Carriers, BookingOptions, Itineraries, Legs } = data;

      // itinerary
      // const itinerary = Itineraries[0];

      Itineraries.forEach((itinerary, index) => {
        // TO DO sort all pricing options and pick lowest
        const bestDeal = itinerary.PricingOptions.reduce(
          (min, p) => (p.Price < min ? p.Price : min),
          itinerary.PricingOptions[0]
        );
        const { Price, DeeplinkUrl, Agents } = bestDeal;

        const leg = Legs.find(leg => leg.Id === itinerary.OutboundLegId);

        const { Departure, Arrival, OriginStation, DestinationStation } = leg;

        // get origin
        const origin = Places.find(place => place.Id === OriginStation).Name;
        // get destination
        const destination = Places.find(
          place => place.Id === DestinationStation
        ).Name;
        // get carrier
        const carrier = Carriers.find(carrier => carrier.Id === leg.Carriers[0])
          .Name;

        const massagedData = {
          destination,
          origin,
          carrier,
          Departure,
          Arrival,
          Price,
          link: DeeplinkUrl
        };

        //TODO stop duplication
        this.results.push(massagedData);
      });

      // this.sortedResults = this.results.sort((a, b) =>
      //   a.Price > b.Price ? 1 : -1
      // );

      this.sortedResults.push(
        this.results.reduce(function(prev, curr) {
          return prev.Price < curr.Price ? prev : curr;
        })
      );
    },

    autoSuggestPlaces: function(query, target) {
      if (query < 2) {
        return;
      }
      fetch(
        `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/autosuggest/v1.0/UK/GBP/en-GB/?query=${query}`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-host":
              "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
            "x-rapidapi-key": config.RAPIDAPI_SKY_KEY
          }
        }
      )
        .then(function(response) {
          response.json().then(function(data) {
            // TODO look at this unusual scoping behaviour here
            target.length = 0;
            target.push(data.Places);
          });
        })
        .catch(err => {
          console.log(err);
        });
    },
    customFormatter(date) {
      this.flightDate = moment(date).format("YYYY-MM-DD");
      return moment(date).format("YYYY-MM-DD");
    }
  },
  components: {
    Results,
    Datepicker
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>


