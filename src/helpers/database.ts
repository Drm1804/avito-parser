import { FirebaseApp, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { Database, getDatabase, set, ref, get, child } from "firebase/database";
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


  getSavedAds(path: string): Promise<Collection<Ad>> {
    return new Promise((resolve, reject) => {
      get(child(ref(this.db), path)).then((snapshot) => {
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
