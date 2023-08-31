const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
        state_id AS stateId,
        state_name AS stateName,
        population
    FROM
        state
    ORDER BY state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray);
});

// API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `
    SELECT
    state_id AS stateId,
    state_name AS stateName,
    population
    FROM
        state
    WHERE
        state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(state);
});

// API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
    INSERT INTO
        district(district_name, state_id, cases, cured, active, deaths)
    VALUES
        (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );`;
  const dbResponse = await db.run(addDistrictQuery);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

// API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT
            district_id AS districtId,
            district_name AS districtName,
            state_id AS stateId,
            cases,
            cured,
            active,
            deaths 
        FROM
            district
        WHERE
            district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

// API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
        district
    WHERE
        district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API 6
app.put("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const districtDetails = request.body;

    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;

    const updateDistrictQuery = `
    UPDATE
        district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE
        district_id = ${districtId};`;
    await db.run(updateDistrictQuery);
    response.send("District Details Updated");
  } catch (e) {
    console.log(`Promise Rejections: ${e.message}`);
  }
});

// API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
        SUM(cases) AS totalCases,
        SUM(cured) AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
    FROM
        district
    WHERE
        state_id = ${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  //console.log(stats);
  //   response.send({
  //     totalCases: stats["SUM(cases)"],
  //     totalCured: stats["SUM(cured)"],
  //     totalActive: stats["SUM(active)"],
  //     totalDeaths: stats["SUM(deaths)"],
  //   });
  response.send(stats);
});

// API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictIdQuery = `
    SELECT
        state_id 
    FROM
        district
    WHERE
        district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
  SELECT
    state_name AS stateName
    FROM
        state
    WHERE
        state_id = ${getDistrictIdQueryResponse.state_id};`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);

  response.send(getStateNameQueryResponse);
});
module.exports = app;
