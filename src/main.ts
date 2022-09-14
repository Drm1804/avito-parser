import jsdom from "jsdom";
const { JSDOM } = jsdom;
import axios from 'axios';
import db, { Ad, Collection } from './helpers/database.js';
import { compareCollections, pause } from './helpers/utils.js';

(async () => {
  await pause();
  let html: string
  try {
    const resp = await axios.get('https://www.avito.ru/moskva/telefony?q=airtag&s=104', { responseType: 'document' })
    html = resp.data;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error);

    } else {
      console.log(error);
    }
  }


  const dom = new JSDOM(html);

  const document = dom.window.document;

  const items = document.querySelectorAll('[data-marker=item]')

  const updateAds: Collection<Ad> = {};

  items.forEach((node) => {
    updateAds[node.id] = {
      id: node.id,
      title: node.querySelector('[itemprop=name]').textContent,
      price: Number(node.querySelector('[itemprop=price]').getAttribute('content')),
      url: node.querySelector('[itemprop=url]').getAttribute('href'),
    }
  })

  const savedAds = await db.getSavedAds('ads');

  const newIds = compareCollections(savedAds, updateAds);

  for(const id of newIds) {
    await db.setNewAd('ads', updateAds[id]);
    await pause(300)
  }

  process.exit(1)

})()

