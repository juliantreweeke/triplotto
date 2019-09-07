// this was used in the main App.vue file in mounted
// as a hacky way to make list of every city's sky scanner cityId codes which are not available online

mounted() {
    var countries = require("../utils/countries.json"); //with path
    var cities = [];
    countries.forEach((country, index) => {
        fetch(
                `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/autosuggest/v1.0/UK/GBP/en-GB/?query=${country.name}`, {
                    method: "GET",
                    headers: {
                        "x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
                        "x-rapidapi-key": config.RAPIDAPI_SKY_KEY
                    }
                }
            )
            .then(response => {
                response.json().then(data => {
                    data.Places.forEach(city => {
                        if (city.CityId === "-sky") {
                            return;
                        }
                        cities.push({
                            id: city.PlaceId,
                            country: city.CountryName
                        });
                        console.log(city.CountryName);
                        if (city.CountryName === "Zimbabwe") {
                            let dataStr = JSON.stringify(cities);
                            let dataUri =
                                "data:application/json;charset=utf-8," +
                                encodeURIComponent(dataStr);
                            let exportFileDefaultName = "data.json";
                            let linkElement = document.createElement("a");
                            linkElement.setAttribute("href", dataUri);
                            linkElement.setAttribute("download", exportFileDefaultName);
                            linkElement.click();
                        }
                    });
                });
            })
            .catch(err => {
                console.log(err);
            });
    });
},