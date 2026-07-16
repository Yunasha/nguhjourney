// import Chart from "https://cdn.jsdelivr.net/npm/chart.js/auto";
import Fuse from "./fuse.js";

const targetUrl = true
  ? "localstorage"
  : "https://mc.nguh.org/w/index.php?title=Data:NguhRoutes%2Fnetwork.json&action=raw";

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
export function removeRouteImpassable(route) {
  return route["stops"].filter((stop) => typeof stop != "string");
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

export async function populateDisplayOfAnHTMLElementFromIdWithStopsFromSingleRoute({
  route,
  elementId,
} = {}) {
  const container = document.getElementById(elementId);
  const fragment = document.createDocumentFragment();
  const isNether = route.code.startsWith("N-");

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
  let stations = await getData();
  stations = stations["stations"];
  removeRouteImpassable(route).forEach((_station) => {
    const item = document.createElement("li");
    item.setAttribute("station-code", _station.code)
    const name = stationNamesFromCode({
      stationsList: stations,
      stationCode: _station.code,
    });
    item.setAttribute("station-name", name[0])
    // item.innerText = `${_station.code} - ${name[0]} ${isNether ? ` (${_station.coords[0] * 8}, ${_station.coords[2] * 8}) Nether: ` : ``}(${_station.coords[0]}, ${_station.coords[2]})`;

    const [x, , z] = _station.coords;

    item.innerText = isNether
      ? `${_station.code} - ${name[0]} (${x * 8}, ${z * 8}) N: (${x}, ${z})`
      : `${_station.code} - ${name[0]} (${x}, ${z})`;

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
  const stopsString = removeRouteImpassable(route)
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
  //   console.log('route to clipboard!');
  // })
}

export function displayStationInfo({ routes, stationName, elementId } = {}) {
  const stationContainer = document.getElementById(elementId);
  const fragment = document.createDocumentFragment();

  const title = document.createElement("h1");
  fragment.appendChild(title);
  title.innerText = stationName;

  const subtitle = document.createElement("h2");
  fragment.appendChild(subtitle);
  subtitle.innerText = "Route(s) this station share:";

  const routesList = document.createElement("ul");
  routesList.classList.add("station-info-list")
  fragment.appendChild(routesList)
  routes.forEach((route) => {
    const item = document.createElement("li")
    item.setAttribute("route-code", route.code)
    routesList.appendChild(item)
    item.innerText = `${route.name} (${route.code})`
  });

  stationContainer.innerHTML = ``
  stationContainer.appendChild(fragment)
  stationContainer.scrollIntoView({ behavior: "smooth", block: "nearest" })
  stationContainer.parentElement.setAttribute("open", true)

}

export async function displayMap({ chart, route, elementId } = {}) {
  const isNether = route.code.startsWith("N-");

  // console.log(route)
  let stations = await getData();
  stations = stations["stations"];

  // console.log(route.loop);
  stations = removeRouteImpassable(route).map((_station) => ({
    x: isNether ? _station.coords[0] * 8 : _station.coords[0],
    y: isNether ? _station.coords[2] * 8 : _station.coords[2],
    name: `${_station.code} - ${stationNamesFromCode({ stationsList: stations, stationCode: _station.code })[0]}`,
  }));
  if (route.loop) stations = [...stations, { ...stations[0] }];

  const data = {
    datasets: [
      {
        // label: route.name,
        data: stations,
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
          stationCode: point["name"].split(" - ")[0],
        }).then((data) => {
          // console.log(data)
          // console.log(point);

          displayStationInfo({ routes: data, stationName: point["name"], elementId: "station-content" })

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
