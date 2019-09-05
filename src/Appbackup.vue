<template>
  <div id="app">
    <h1>Trip Planner</h1>
    <button v-on:click="searchLiveFlights">Find your next trip</button>
    <Results v-bind:sortedResults="this.sortedResults" />

    <!-- 
    <h2>FLIGHTS NON LIVE</h2>
    <img alt="Vue logo" src="./assets/logo.png" />
    <select v-model="selectedCity">
      <option v-for="city in cities" :value="city">{{ city.text }}</option>
    </select>
    <button v-on:click="searchFlights(selectedCity.value)">SEARCH</button>
    <Results v-bind:results="this.results" />-->
  </div>
</template>

<script>
import Results from "./components/Results.vue";

export default {
  name: "app",
  data() {
    return {
      results: [],
      sortedResults: [],
      selectedCity: {},
      cities: [
        { value: "SYD", text: "Sydney" },
        { value: "MEL", text: "Melbourne" }
      ]
    };
  },
  methods: {
    searchLiveFlights: function() {
      fetch(
        "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/pricing/v1.0",
        {
          method: "POST",
          headers: {
            "Access-Control-Expose-Headers": "Location",
            "x-rapidapi-host":
              "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
            "x-rapidapi-key":
              "cc3d11e521msh5d393f6016eb20ap118c94jsn766eab78b092",
            Accept: "application/json",
            "content-type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            country: "US",
            currency: "USD",
            locale: "en-US",
            originPlace: "SFO-sky",
            destinationPlace: "anywhere",
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
            "x-rapidapi-key":
              "cc3d11e521msh5d393f6016eb20ap118c94jsn766eab78b092"
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

      debugger;

      // SEGMENT
      // const segment = { ...data.Segments[0] };
      // const { DepartureDateTime, ArrivalDateTime, Carrier } = segment;

      // // get origin
      // const origin = Places.find(place => place.Id === segment.OriginStation)
      //   .Name;
      // // get destination
      // const destination = Places.find(
      //   place => place.Id === segment.DestinationStation
      // ).Name;
      // // get carrier
      // const carrier = Carriers.find(carrier => carrier.Id === segment.Carrier)
      //   .Name;

      // const massagedData = {
      //   destination,
      //   origin,
      //   DepartureDateTime,
      //   ArrivalDateTime,
      //   carrier
      // };
      // this.sortedResults = massagedData;
      // debugger;

      // console.log(origin);
      // debugger;
      // const origin = massagedData.find(
      //   Places => Places.OriginStation === massagedData.OriginStation
      // );

      // inventory.find( fruit => fruit.name === 'cherries' );

      // this.sortedResults = massagedData;
    }

    // searchFlights: function(city) {
    //   fetch(
    //     `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browsequotes/v1.0/US/USD/en-US/${city}-sky/anywhere/2019-09-16?inboundpartialdate=anytime`,
    //     {
    //       method: "GET",
    //       headers: {
    //         "Access-Control-Allow-Origin": "*",
    //         "x-rapidapi-host":
    //           "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
    //         "x-rapidapi-key":
    //           "cc3d11e521msh5d393f6016eb20ap118c94jsn766eab78b092"
    //       }
    //     }
    //   )
    //     .then(response => {
    //       console.log(response);
    //       if (response.status !== 200) {
    //         console.log(
    //           "Looks like there was a problem. Status Code: " + response.status
    //         );
    //         return;
    //       }
    //       response.json().then(data => {
    //         this.results = data;
    //         console.log("data", data);
    //       });
    //     })
    //     .catch(err => {
    //       console.log(err);
    //     });
    // }
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


