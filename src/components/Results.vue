<template>
  <div class="results">
    <h1>Here are your mofo flights you bastard</h1>
    <div v-if="sortedResults">
      <!-- <h2 v-if="sortedResults[0].origin">
        
      </h2>-->
      <ul>
        <li class="results__card" v-for="result in sortedResults">
          <p>Origin:{{result.origin}}</p>
          <p>Departure Time:{{result.Departure}}</p>
          <p>Destination:{{result.destination}}</p>
          <p>Arrival Time:{{result.Arrival}}</p>
          <p>Carrier:{{result.carrier}}</p>
          <p>Price:{{result.Price}}</p>
          <a target="_blank" v-bind:href="result.link">Buy</a>
        </li>
      </ul>
      <!-- 
      <div class="results__card">
        <p>Origin:{{sortedResults.origin}}</p>
        <p>Departure Time:{{sortedResults.Departure}}</p>
        <p>Destination:{{sortedResults.destination}}</p>
        <p>Arrival Time:{{sortedResults.Arrival}}</p>
        <p>Carrier:{{sortedResults.carrier}}</p>
        <p>Price:{{sortedResults.Price}}</p>
        <a target="_blank" v-bind:href="sortedResults.link">Buy</a>
      </div>-->
    </div>

    <!-- <p :results="true">{{results}}</p> -->
    <!-- <p :results="true">{{results.Places[0].Name}}</p> -->
  </div>
</template>

<script>
export default {
  name: "Results",
  props: ["sortedResults"]
  // props: {
  //   origin: String
  // }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.results__card {
  border: 1px solid black;
  background: gainsboro;
  text-align: left;
  width: 100%;
  margin-bottom: 10px;
}

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
