import axios from 'axios';
import jsdom from "jsdom";
const { JSDOM } = jsdom;
import db, { Ad, Collection, Task } from './database.js';
import { compareCollections } from './utils.js';

export class Avito {
  private baseUrl = 'https://www.avito.ru';
  private _updateAds: Collection<Ad>;
  private _task: Task;
  constructor(task: Task) {
    this._task = task;
  }

  get updateAds() {
    return this._updateAds
  }

  async getAdsIds(): Promise<string[]> {
    const savedAds = await db.getSavedAds(this._task.id);

    for(const city of this._task.cities) {
      const html = await this.fetchAds(this.baseUrl, city, this._task.category);
      this._updateAds = {...this._updateAds, ...this.getAdsFromDom(html)};
      console.log('Добавитл информацию для говрода ' + city);

    }

    const newIds = compareCollections(savedAds, this._updateAds);
    console.log('Обнаружено ' + newIds.length + ' новых объявлений');
    return newIds;
  }

  // метод запроса объявлений с авито
  private async fetchAds(baseUrl: string, city:string, category: string): Promise<string> { //html страница в виде стороки
    let html: string;
    try {
      const resp = await axios.get(`${baseUrl}/${city}/${category}?q=airtag&s=104`, { responseType: 'document' })
      html = resp.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(error);

      } else {
        console.log(error);
      }
    }
    return html;
  }

  private getAdsFromDom(html: string) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const items = document.querySelectorAll('[data-marker=item]');
    const ads: Collection<Ad> = {}

    items.forEach((node) => {
      ads[node.id] = {
        id: node.id,
        title: node.querySelector('[itemprop=name]').textContent,
        price: Number(node.querySelector('[itemprop=price]').getAttribute('content')),
        url: node.querySelector('[itemprop=url]').getAttribute('href'),
      }
    })

    return ads;
  }
}
