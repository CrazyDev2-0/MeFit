const Bree = require("bree");
const Cabin = require("cabin");
const Graceful = require("@ladjs/graceful");
const { Signale } = require("signale");

// initialize cabin
const cabin = new Cabin({
  axe: {
    logger: new Signale(),
  },
});

const bree = new Bree({
  logger: cabin,
  jobs: [
    {
      name: "handlePersonalizedMonitoring",
      interval: "1s",
    },
    {
      name: "retrainModels",
      cron: "0 0 * * *",
      cronValidate: {
        override: {
          useBlankDay: true,
        },
      },
    },
    {
      name: "checkOutdatedVitalsData",
      cron: "0 0 * * *",
      cronValidate: {
        override: {
          useBlankDay: true,
        },
      }
    }
  ],
});

// handle graceful reloads, pm2 support, and events like SIGHUP, SIGINT, etc.
const graceful = new Graceful({ brees: [bree] });
graceful.listen();

// start all jobs (this is the equivalent of reloading a crontab):
bree.start();
