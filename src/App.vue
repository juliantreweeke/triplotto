<template>
  <div id="app">
    <h1>Trip Planner</h1>
    <h3>Origin:{{origin}}</h3>
    <input v-model="origin" placeholder="your origin" />

    <select v-if="suggestedPlaces" v-model="selectedCity">
      <option
        v-bind:key="index"
        v-for="(place, index) in suggestedPlaces"
        v-bind:value="place.PlaceName"
      >{{place.PlaceName}},{{place.CountryName}}</option>
    </select>

    <button v-on:click="searchLiveFlights">Find your next trip</button>
    <Results v-bind:sortedResults="this.sortedResults" />
  </div>
</template>

<script>
import Results from "./components/Results.vue";
import config from "../config.js";
import _ from "lodash";

export default {
  name: "app",
  data() {
    return {
      origin: "",
      results: [],
      sortedResults: [],
      suggestedPlaces: [],
      selectedCity: "default",
      cities: [
        { value: "SYD", text: "Sydney" },
        { value: "MEL", text: "Melbourne" }
      ]
    };
  },
  watch: {
    origin: function() {
      this.debouncedAutoSuggestPlaces();
    },
    // when select dropdown changes, get the city Id code and run the sky scanner fetch request with the code
    selectedCity: function() {
      const selectedCityCode = this.suggestedPlaces.find(
        place => place.PlaceName === this.selectedCity
      ).CityId;
      this.searchLiveFlights(selectedCityCode);
    }
  },
  created: function() {
    this.debouncedAutoSuggestPlaces = _.debounce(function() {
      this.autoSuggestPlaces(this.origin), 500;
    });
  },

  methods: {
    searchLiveFlights: function(query) {
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
            originPlace: query,
            destinationPlace: "ATH-sky",
            outboundDate: "2019-09-22",
            adults: "1"
          })
        }
      )
        .then(response => {
          if (response.status === 429) {
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
        // console.log(destination);
        this.results.push(massagedData);
      });

      this.sortedResults = this.results.sort((a, b) =>
        a.Price > b.Price ? 1 : -1
      );

      console.log(this.sortedResults);
    },

    autoSuggestPlaces: function(query) {
      if (this.origin.length < 2) {
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
        .then(response => {
          response.json().then(data => {
            this.suggestedPlaces = data.Places;
          });
        })
        .catch(err => {
          console.log(err);
        });
    }
  },
  components: {
    Results
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


