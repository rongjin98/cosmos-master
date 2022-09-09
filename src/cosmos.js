const { init: initShuttleDb } = require("./dbs/shuttle");
const createSpaceTravelEmitter = require("./private/space-travel-emitter");
const log = require("./logger");
const shuttleUtil = require("./util/shuttle");
const cadet = require("./cadet");

const listen = async () => {
  //CHANGE1: initShuttleDb is an async func, should use await, otherwise only promise will be returned
  const shuttleDb = await initShuttleDb();
  //

  const spaceTravelEmitter = createSpaceTravelEmitter();
  let totalCrewCount = 0;
  spaceTravelEmitter.on("space-request", (evt) => {
    log("space-request", evt);
    ++totalCrewCount;
    onSpaceTravelRequested({ shuttleDb, ...evt });
  });
  spaceTravelEmitter.on("end", async (evt) => {
    shuttleUtil.validateShuttles({
      shuttleMap: await shuttleDb.read(),
      crewCount: totalCrewCount,
    });
    log(
      [
        "no more space requests, exiting.",
        `db can be viewed: ${shuttleDb.getDbFilename()}`,
      ].join(" ")
    );
  });
};

const onSpaceTravelRequested = async ({ shuttleDb, cosmonautId }) => {
  console.log("onSpaceTravelRequested Called");
  const shuttles = await shuttleDb.read();
  console.log("READING SHUTTLES", cosmonautId, shuttles);
  /* CHANGE2: Shuttles is an object, which has no property of "find" */
  // const availableShuttle = shuttles.find(
  //   ({ date, capacity }) => date >= 0 && capacity > 0
  // );
  const availableShuttle = findAvailableShuttles(shuttles);
  //

  if (!availableShuttle) {
    throw new Error(
      `unable to schedule cosmonautId ${cosmonautId}, no shuttles available`
    );
  }
  log(
    `found shuttle for cosmonautId ${cosmonautId}, shuttle ${availableShuttle.name}`
  );
  --availableShuttle.remainingCapacity;
  availableShuttle.crew.push(cosmonautId);
  await shuttleDb.write(availableShuttle.name, availableShuttle);
  await cadet.logWelcomeLetter({ cosmonautId, shuttle: availableShuttle });
};

const findAvailableShuttles = (shuttles) => {
  for (const shuttle in shuttles) {
    const shuttleProps = JSON.parse(shuttles[shuttle]);
    if (shuttleProps.date > 0 && shuttleProps.remainingCapacity > 0) {
      console.log(shuttleProps);
      return shuttleProps;
    }
  }
};

module.exports = {
  listen,
};
