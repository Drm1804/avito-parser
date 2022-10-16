import { FirebaseApp, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { Database, getDatabase, set, ref, get, child, onChildAdded, onChildMoved, onChildRemoved, onChildChanged } from "firebase/database";
import { conf } from '../../config.js'

class DatabaseService {
  app: FirebaseApp
  db: Database
  constructor() {
    try {

      this.app = initializeApp({
        ...conf.firebase
      });

      const auth = getAuth();
      signInWithEmailAndPassword(auth, conf.authFirebase.email, conf.authFirebase.password).catch(function (error) {
        const { code, message } = error;
        console.log(`${code} - ${message}`);
      });

      this.db = getDatabase(this.app);
      console.log('Инициализированно');

    } catch (err) {
      console.log(err);

      console.error('Application works without database!!');
    }
  }


  getSavedAds(taskId: string): Promise<Collection<Ad>> {
    return new Promise((resolve, reject) => {
      get(child(ref(this.db), 'ads/' + taskId)).then((snapshot) => {
        if (snapshot.exists()) {
          resolve(snapshot.val() || {})
        } else {
          reject("No data available")
        }
      }).catch((error) => {
        reject(error)
      });
    })
  }

  setNewAd(path: string, ad: Ad) {
    return new Promise((resolve, reject) => {
      set(ref(this.db, path + '/' + ad.id), ad).then(() => resolve(''))
        .catch((error) => {
          reject(error)
        });
    })
  }

  getTasks(): Promise<Collection<Task>> {
    return new Promise((resolve, reject) => {
      get(child(ref(this.db), 'tasks')).then((snapshot) => resolve(snapshot.val()))
        .catch(err => {
          reject(err)
        })
    })
  }

  subscribeToTaskChange() {
    let activatePause = true;

    return new Promise(resolve => {
      onChildChanged(ref(this.db, 'tasks'), (sn) => resolve(sn.val()));
      onChildMoved(ref(this.db, 'tasks'), (sn) => resolve(sn.val()));
      onChildRemoved(ref(this.db, 'tasks'), (sn) => resolve(sn.val()));
      onChildAdded(ref(this.db, 'tasks'), (sn) => {
        setTimeout(() => {
          activatePause = false;
        })
        if(!activatePause) {
          resolve(sn.val())
        }
      });
    })
  }

}


const db = new DatabaseService();
export default db;

export interface Collection<T> {
  [key: string]: T
}

export interface ReciptsCollection {
  [key: string]: Ad
}

export interface Ad {
  id: string
  title: string,
  price: number,
  url: string
}

export interface Task {
  id: string,
  cron: string,
  query: string,
  cities: string[],
  category: string,
}
