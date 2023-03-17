const searchFormEl = $("#searchForm");
const searchInputEl = $("#searchInput");
const searchSubmitBtn = $("searchSubmit");
const prevSearchesEl = $("#prevSearches");
const forecastEl = $("#forecast");
const currentImgEl = $("#currentImg");
const currentCityEl = $("#currentCity");
const currentDateEl = $("#currentDate");
const currentTempEl = $("#currentTemp");
const currentWindEl = $("#currentWind");
const currentHumidityEl = $("#currentHumidity");
const cardContainerEl = $("#cardContainer");
const APIkey = "e8d02c52ad285afc335be8832bc06b3b";

dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);


let prevSearches;
let recentData;


let loadPrevSearches = function() {
    prevSearchesEl.empty()
    prevSearches = JSON.parse(localStorage.getItem("Previous Searches"));
    if(prevSearches === null) {
        prevSearches = [];
    }
    for (let i = 0; i < prevSearches.length && i < 5; i++) {
        let newPrevSearchEl = $("<button>").addClass('btn btn-secondary w-100 my-1').text(prevSearches[i].LocName).attr('data-coord',prevSearches[i].LocCoord);
        prevSearchesEl.append(newPrevSearchEl);
    }
};


let getCoord = function(c) {
    for (let i = 0; i < prevSearches.length; i++) {
        if (prevSearches[i].LocName === c) {
            return prevSearches[i].LocCoord;
        }
    }
};


let getLocation = function(event) {
    event.preventDefault();

    if (searchInputEl.val() !== "") {
        let cityName = processCityName(searchInputEl.val());
        searchInputEl.val("");
        
        if (isNewSearch(cityName)) {
            let requestURL = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${APIkey}`;
            fetch(requestURL).then(res => {
                if(res.status == 200) {
                    res.json().then(data => {
                        prevSearches.unshift({LocName: cityName, LocCoord: [data[0].lat.toFixed(2), data[0].lon.toFixed(2)]});
                        localStorage.setItem("Previous Searches",JSON.stringify(prevSearches));
                        loadPrevSearches();
                        smartSearch(cityName);
                    })
                }
            })
        } else {
            makeRecentSearch(cityName);
            smartSearch(cityName);
        }
    }
};


let processCityName = function(c) {
    let words = c.split(/(\s+)/).filter(e => e.trim().length > 0);
    result = "";
    for (let i = 0; i < words.length; i++) {
        result += words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
        if (i < words.length - 1) {
            result += " ";
        }
    }
    return result;
};


let isNewSearch = function(c) {
    let notFound = true;
    for (let i = 0; i < prevSearches.length; i++) {
        if (prevSearches[i].LocName === c) {
            notFound = false;
        }
    }
    return notFound;
};


let makeRecentSearch = function(c) {
    let index;
    for (let i = 0; i < prevSearches.length; i++) {
        if (prevSearches[i].LocName === c) {
            index = i;
        }
    }
    if(index >= 5) {
        prevSearches.unshift(prevSearches.splice(index, 1)[0]);
        localStorage.setItem("Previous Searches",JSON.stringify(prevSearches));
    }
    loadPrevSearches();
};


// Searches saved weather data for specific city; calls weather data API if no previous data is found, or if data is older than 1 hour.
let smartSearch = function(c) {
    recentData = JSON.parse(localStorage.getItem("Recent Data"));
    if (recentData === null) {
        recentData = []
        getWeather(c);
    } else {
        let dataIndex = -1;
        for (let i = 0; i < recentData.length; i++) {
            if (recentData[i].LocName === c) {
                if (dayjs().diff(recentData[i].timestamp, 'h') < 1) {
                    dataIndex = i;
                }
            }
        }
        if (dataIndex === -1) {
            getWeather(c);
        } else {
            loadWeatherData(recentData[dataIndex].LocData);
        }
    }
};


let getWeather = function(c) {
    let loc = getCoord(c);
    let requestURL = `http://api.openweathermap.org/data/2.5/forecast?lat=${loc[0]}&lon=${loc[1]}&appid=${APIkey}&units=imperial`;
    fetch(requestURL).then(res => {
        if(res.status == 200) {
            res.json().then(data => {
                recentData.push({LocName: c, LocData: data, timestamp: dayjs()});
                localStorage.setItem("Recent Data", JSON.stringify(recentData));
                loadWeatherData(data);
            })
        }
    })
};


let loadWeatherData = function(d) {
    console.log(d);
    forecastEl.removeClass("d-none");
    currentImgEl.attr('src',`https://openweathermap.org/img/wn/${d.list[0].weather[0].icon}@4x.png`)
    currentCityEl.text(d.city.name);
    currentDateEl.text(dayjs.utc(d.list[0].dt_txt).tz('America/Chicago').format('dddd - M/D/YY'));
    currentTempEl.text(`${d.list[0].main.temp} °F`)
    currentWindEl.text(`${d.list[0].wind.speed} mph`)
    currentHumidityEl.text(`${d.list[0].main.humidity}%`)

    cardContainerEl.empty();
    for (let i = 7; i < d.list.length; i+= 8) {
        let newWeatherCard = $("<div>").addClass("card bg-light mx-2 mb-2 col-lg-2 future")
            .append($("<img>").addClass("card-img-top d-none d-lg-block").attr('src', `https://openweathermap.org/img/wn/${d.list[i].weather[0].icon}@4x.png`).attr('alt', 'Weather Icon'))
            .append($("<h5>").addClass("card-header text-center text-lg-start").text(dayjs.utc(d.list[i].dt_txt).tz('America/Chicago').format('ddd')))
            .append($("<div>").addClass("card-body p-2")
                .append($("<p>").addClass("card-text text-center text-lg-start").text(`Temp: ${d.list[i].main.temp} °F`))
                .append($("<p>").addClass("card-text text-center text-lg-start").text(`Wind: ${d.list[i].wind.speed} mph`))
                .append($("<p>").addClass("card-text text-center text-lg-start").text(`Humidity: ${d.list[i].main.humidity}%`)));
        cardContainerEl.append(newWeatherCard);
    }
};


searchFormEl.on('submit', getLocation);
prevSearchesEl.on('click', '.btn-secondary', function(event) {
    let cityName = $(event.target).text();
    makeRecentSearch(cityName);
    smartSearch(cityName);
})

loadPrevSearches();