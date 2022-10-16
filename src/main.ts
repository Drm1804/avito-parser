import { CronJob } from 'cron';
import { Avito } from './helpers/avito.js';
import db, { Task } from './helpers/database.js';
import { pause } from './helpers/utils.js';

function createJob(task: Task): CronJob {
  console.log('Создаю задачу ' + task.id);

  return new CronJob(task.cron, async () => {
    const avito = new Avito(task);
    console.log('Запускаю задачу ' + task.id);

    try {
      const newIds = await avito.getAdsIds();

      for (const id of newIds) {
        await db.setNewAd(task.id, avito.updateAds[id]);
        await pause(300);
      }

    } catch (err) {
      console.error(err);
    }

  })

}


async function run() {
  const jobs = []; //для хранения cronJobs
  await pause(5000);
  let fullTasks = []; // для хранения задач, полученных из FB

  try {
    fullTasks = Object.values(await db.getTasks());
    console.log('Получен список задач');
  } catch (err) {
    console.error(err);
  }

  for (const task of fullTasks) {
    const job = createJob(task);
    job.start();
    jobs.push(job);
  }

  db.subscribeToTaskChange().then(() => {
    jobs.forEach((j: CronJob) => j.stop());
    run();
  })
}

run();
