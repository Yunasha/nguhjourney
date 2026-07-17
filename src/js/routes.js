// import Chart from "https://cdn.jsdelivr.net/npm/chart.js/auto";
import Fuse from "./fuse.js";

const targetUrl = true
  ? "localstorage"
  : "https://mc.nguh.org/w/index.php?title=Data:NguhRoutes%2Fnetwork.json&action=raw";

const countryUrl = true
  ? "../../country.json"
  : "https://mc.nguh.org/w/index.php?title=Data:Places&action=raw";

export async function getAllCountries({ url = countryUrl } = {}) {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error(`Unable to get country data \n"guh"`);

  const result = await response.json();

  return result["places"];
}

export async function getAssociatedCountries({
  code2,
  strictSearch = false,
} = {}) {
  if (!code2) {
    throw new Error(`code2 is empty.\n"stop it. get some help"`);
  }

  const countries = await getAllCountries();
  let result = countries.filter((country) => country.code2 == code2);
  if (strictSearch && result.length == 0) {
    throw new Error(
      `no country is associated with the code ${code2} is empty.\n"YOLO"`,
    );
  }
  return result;
}

async function getData({ url = targetUrl } = {}) {
  let result;

  if (targetUrl == "localstorage") {
    // console.log("Data is loaded from localstorage");
    try {
      result = JSON.parse(localStorage.getItem("nguhcraftRoutes"));

      if (!result) {
        document.getElementById("error").style.display = "block";
        document.getElementById("error").scrollIntoView();
        throw new Error(`Data not found`);
      }
      document.getElementById("error").style.display = "none";
    } catch (e) {
      throw new Error(`Unable to read the localstorage data: ${e}.\n"skibidi"`);
    }
  } else {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok)
      throw new Error(`Failed to get the data: ${response.statusText}`);
    result = await response.json();
  }

  if (result.format != "7.0")
    throw new Error(
      `provided routes data version of '${result.format}' don't match the expected version of 7.0\n"are we deadass?"`,
    );

  if (result) {
    return result;
  } else {
    throw new Error("WHERE'S THE UFCKING DATA");
  }
}

export async function getRoutes({ url = targetUrl } = {}) {
  // here we try
  const result = await getData({ url });
  return result["lines"];
}

export async function getDimensionRoutes({ url = targetUrl, dimension } = {}) {
  const routes = await getRoutes({ url });
  if (!["overworld", "nether"].includes(dimension))
    throw new Error(
      `Unknown dimension of '${dimension}'\n"Not so Dr. Strange after all"`,
    );
  return routes[{ overworld: "overworld", nether: "the_nether" }[dimension]];
}

export async function getRoutesCode({ url = targetUrl, dimension } = {}) {
  const routes = await getRoutes({ url });
  return Object.values(routes)
    .flat()
    .map((_lines) => _lines.code);
}

export async function getRoute({ url = targetUrl, code } = {}) {
  const routes = await getRoutes({ url });
  const route = Object.values(routes)
    .flat()
    .find((_line) => _line.code == code);
  if (route) return route;
  throw new Error(`No route found for code '${code}'\n"skill issue"`);
}

// despite the name, it will not make them passable
// forget that. we gonna unfuck it
export function unfuckRoute(route) {
  return route["stops"].filter(
    (stop) => typeof stop != "string" && stop.coords,
  );
}

export async function getAssociatedStationRoutes({
  url = targetUrl,
  stationCode,
} = {}) {
  if (!stationCode)
    throw new Error(`StationCode is empty\n"wtf am i suppose to do??"`);

  const routes = await getRoutes({ url });
  const associatedRoutes = Object.values(routes)
    .flat()
    .filter((_route) =>
      _route["stops"].some((_station) => _station.code == stationCode),
    );
  // console.log(associatedRoutes);
  // console.log(stationCode)
  // console.log(
  //   Object.values(routes)
  //     .flat()
  //     .filter((_route) =>
  //       _route["stops"].some((_station) => _station.code == stationCode),
  //     ),
  // );
  if (associatedRoutes) return associatedRoutes;
  throw new Error(`No route is associated with station code '${code}'\n"how"`);
}

export function stationNamesFromCode({
  stationsList,
  stationCode,
  strictSearch = false,
} = {}) {
  // const result = await getData({ url });
  // const stations = result["stations"];

  let translated = stationsList[stationCode];

  if (!translated) {
    if (strictSearch)
      throw new Error(
        `No name is associated for the code ${stationCode}.\n"Are you sure?"`,
      );

    translated = [stationCode];
    console.warn(
      `No name is associated for the code ${stationCode}.\n"Are you sure?"`,
    );
  }

  if (typeof translated == "string") translated = [translated];

  return translated;
}

export function searchStopConnections({
  url = targetUrl,
  stationCode,
  connections,
} = {}) {
  const searchResult = connections.find((_connection) =>
    _connection.some((_station) => _station["code"] == stationCode),
  );

  // console.log("->", searchResult)

  if (searchResult) return searchResult;
  return [];
}

export async function populateDisplayOfAnHTMLElementFromIdWithStopsFromSingleRoute({
  route,
  elementId,
} = {}) {
  const container = document.getElementById(elementId);
  const fragment = document.createDocumentFragment();
  const isNetherRoute = route.code.startsWith("N-");

  container.style.display = "block";

  // title
  const title = document.createElement("h2");
  title.classList.add("title");
  title.classList.add("titlebar-title");
  // title.classList.add("title-route");
  title.innerText = `${route.name} (${route.code})`;
  title.style.backgroundColor = route.color ?? "#000";
  title.style.color = `contrast-color(${route.color ?? "#000"})`;
  fragment.appendChild(title);

  //content container
  const contentContainer = document.createElement("div");
  contentContainer.classList.add("main-content");
  // contentContainer.classList.add("outset-border")
  fragment.appendChild(contentContainer);

  // list
  const listContainer = document.createElement("ul");
  listContainer.classList.add("routes-list");
  contentContainer.appendChild(listContainer);

  // populate list
  const data = await getData();
  const stations = data["stations"];
  unfuckRoute(route).forEach((_station) => {
    let [x, , z] = _station.coords; //guhh
    // const isNether = _station.code.startsWith("N-");

    const item = document.createElement("li");
    item.setAttribute("station-code", _station.code);
    // item.setAttribute("station-x", x);
    // item.setAttribute("station-z", z);
    // const name = stationNamesFromCode({
    //   stationsList: stations,
    //   stationCode: _station.code,
    // });
    // item.setAttribute("station-name", name[0]);
    // item.innerText = `${_station.code} ⋅ ${name[0]} ${isNether ? ` (${_station.coords[0] * 8}, ${_station.coords[2] * 8}) Nether: ` : ``}(${_station.coords[0]}, ${_station.coords[2]})`;

    // console.log(_station.code)
    const stationConnection = searchStopConnections({
      stationCode: _station.code,
      connections: data["connections"],
    });

    // console.log(stationConnection);

    let displayedCode;
    let [xn, _, zn] = [];
    let isNether = false;

    if (stationConnection.length > 0) {
      displayedCode = stationConnection
        .map((_connection) => _connection["code"])
        .join(" / ");

      // console.log(
      //   stationConnection.find((_connection) =>
      //     _connection["code"].startsWith("N-"),
      //   )["coords"]
      // );

      [xn, _, zn] = stationConnection.find((_connection) =>
        _connection["code"].startsWith("N-"),
      )["coords"];

      [x, _, z] = stationConnection.find(
        (_connection) => !_connection["code"].startsWith("N-"),
      )["coords"];

      isNether = true;

      // console.log(xn, zn, isNether);
      // console.log("????")
    } else {
      displayedCode = _station.code;
      if (isNetherRoute) {
        // correction for nether route
        displayedCode = `N-${_station.code}`;
        x *= 8;
        z *= 8;
      }
    }

    item.setAttribute("station-x", x);
    item.setAttribute("station-z", z);
    item.setAttribute("station-xn", xn);
    item.setAttribute("station-zn", zn);

    // TODO: please change this
    const name = stationNamesFromCode({
      stationsList: stations,
      // stationCode: _station.code,
      stationCode: isNetherRoute
        ? (displayedCode.split(" / ")[1] ?? displayedCode)
        : displayedCode.split(" / ")[0], // ass was to get the name
    });

    item.setAttribute("station-name", name[0]);

    item.innerText = isNether // what was this again?
      ? // ? `${displayedCode} ⋅ ${name[0]} (${x}, ${z}) => (${x * 8}, ${z * 8})`
        `${displayedCode} ⋅ ${name[0]} (${x}, ${z}) => (${xn}, ${zn})`
      : `${displayedCode} ⋅ ${name[0]} (${x}, ${z})`;

    // item.style.fontFamily = "monospace";
    // item.style.fontSize = "0.9rem";
    listContainer.appendChild(item);
  });
  if (route.loop) {
    const itemLoop = document.createElement("li");
    itemLoop.innerText = "[LOOP BACK]";
    listContainer.appendChild(itemLoop);
  }

  // array of stops
  const stopsList = document.createElement("p");
  const stopsString = unfuckRoute(route)
    .map((_station) => `(${_station.coords[0]},${_station.coords[2]})`)
    .join();
  stopsList.innerText = `[${stopsString}]`;
  stopsList.classList.add("routes-copy");
  // stopsList.style.fontSize = "0.75rem";
  // stopsList.style.fontFamily = "monospace";
  contentContainer.appendChild(stopsList);

  container.innerHTML = ``;
  container.appendChild(fragment);

  // stopsList.addEventListener("click", () => {
  //   navigator.clipboard.writeText(stopsString);
  //   // console.log('route to clipboard!');
  // })
}

export function displayStationInfo({
  routes,
  stationName,
  elementId,
  coords,
  netherCoords,
} = {}) {
  const stationContainer = document.getElementById(elementId);
  const fragment = document.createDocumentFragment();

  const title = document.createElement("h1");
  fragment.appendChild(title);
  title.innerText =
    netherCoords[0] != "undefined" // don't ask how
      ? `${stationName} (${coords.join(", ")}) => (${netherCoords.join(", ")})`
      : `${stationName} (${coords.join(", ")})`;
  // console.log(coords);
  // console.log(netherCoords);

  const info = document.createElement("p");
  info.innerText = `-`;
  fragment.appendChild(info);

  getAssociatedCountries({
    code2: stationName.split(" ⋅ ")[0].slice(0, 2),
  }).then((countries) => {
    // console.log(countries);

    if (countries.length > 0) {
      const country = countries[0];
      info.innerText = `${country.common_name} ⋅ ${country.code3}`;
    } else {
      info.innerText = `is an orphaned stop`;
    }
  });

  const subtitle = document.createElement("h2");
  fragment.appendChild(subtitle);
  subtitle.innerText = "Route(s) this station share:";

  const routesList = document.createElement("ul");
  routesList.classList.add("station-info-list");
  fragment.appendChild(routesList);
  routes.forEach((route) => {
    const item = document.createElement("li");
    item.setAttribute("route-code", route.code);
    routesList.appendChild(item);
    item.innerText = `${route.name} (${route.code})`;
  });

  stationContainer.innerHTML = ``;
  stationContainer.appendChild(fragment);
  stationContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  stationContainer.parentElement.setAttribute("open", true);
}

export async function displayMap({ chart, route, elementId } = {}) {
  // const isNether = route.code.startsWith("N-");

  // console.log(route)
  let stations = await getData();
  stations = stations["stations"];

  // console.log(route.loop);
  // console.log(route);
  // stations = unfuckRoute(route).map((_station) => ({
  //   x: isNether ? _station.coords[0] * 8 : _station.coords[0],
  //   y: isNether ? _station.coords[2] * 8 : _station.coords[2],
  //   name: `${_station.code} ⋅ ${stationNamesFromCode({ stationsList: stations, stationCode: _station.code })[0]}`,
  // }));

  const routesData = await getData();

  let dataset = [];
  unfuckRoute(route).forEach((_station) => {
    // const isNether = _station.code.startsWith("N-")
    let [x, _, z] = [];
    let [xn, zn] = [];
    let isNether = false;
    const stationName = `${_station.code} ⋅ ${stationNamesFromCode({ stationsList: stations, stationCode: _station.code })[0]}`;

    const stationConnection = searchStopConnections({
      stationCode: _station.code,
      connections: routesData["connections"],
    });

    if (stationConnection.length > 0) {
      [xn, _, zn] = stationConnection.find((_connection) =>
        _connection["code"].startsWith("N-"),
      )["coords"];

      [x, _, z] = stationConnection.find(
        (_connection) => !_connection["code"].startsWith("N-"),
      )["coords"];
    } else {
      [x, _, z] = _station["coords"];
      if (route.code.startsWith("N-")) {
        xn = "undefined";
        zn = "undefined";
        x *= 8;
        z *= 8;
      }
    }

    dataset.push({
      x: x,
      y: z,
      xn: xn,
      yn: zn,
      name: stationName,
    });
  });

  if (route.loop) dataset = [...dataset, { ...dataset[0] }];

  const data = {
    datasets: [
      {
        // label: route.name,
        data: dataset,
        backgroundColor: "#0000",
        // backgroundColor: route.color ?? "#000",

        showLine: true,
        borderColor: "#000",
        // borderColor: route.color ?? "#000",
        borderWidth: 1,
        pointRadius: 4,
      },
    ],
  };

  const config = {
    type: "scatter",
    data: data,
    options: {
      maintainAspectRatio: false,
      onClick(event, elements, chart) {
        if (elements.length === 0) return;

        const { datasetIndex, index } = elements[0];

        // console.log("Dataset:", datasetIndex);
        // console.log("Point:", index);

        const point = chart.data.datasets[datasetIndex].data[index];
        getAssociatedStationRoutes({
          stationCode: point["name"].split(" ⋅ ")[0],
        }).then((data) => {
          // console.log(data)
          // console.log(point);

          displayStationInfo({
            routes: data,
            stationName: point["name"],
            elementId: "station-content",
            coords: [point.x, point.y],
            netherCoords: [point["xn"], point["yn"]],
          });
        });
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label(context) {
              return [
                `${context.raw.name}`,
                `${context.parsed.x}, ${context.parsed.y}`,
              ];
            },
          },
          filter(item) {
            const last = item.dataset.data.length - 1;

            return !(
              item.dataIndex === last &&
              item.raw.x === item.dataset.data[0].x &&
              item.raw.y === item.dataset.data[0].y
            );
          },
        },
      },
      ticks: {
        stepSize: 100,
      },
      scales: {
        x: {
          min: -8000,
          max: 8000,
          position: {
            y: 0,
          },
          border: {
            color: "#0006",
          },
          ticks: {
            // display: false,
            color: "#000a",
            font: {
              size: 8,
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          reverse: true,
          min: -8000,
          max: 8000,
          position: {
            x: 0,
          },
          border: {
            color: "#0006",
          },
          ticks: {
            // display: false,
            color: "#000a",
            font: {
              size: 8,
            },
          },
          grid: {
            display: false,
          },
        },
      },
    },
  };

  // console.log(typeof chart.Chart);
  if (!chart) {
    return new Chart(document.getElementById(elementId), config);
  } else {
    // console.log("already init")
    // console.log(chart)
    chart.data.datasets[0].data = data.datasets[0].data;
    // chart.config = config;
    chart.update();
    return chart;
  }
}
