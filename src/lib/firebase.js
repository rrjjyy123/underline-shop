import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// 웹 앱 설정값은 공개되어도 되는 식별자다. 접근 제어는 firestore.rules가 담당한다.
const firebaseConfig = {
  apiKey: 'AIzaSyCq3JOTz2Cuf9HkpA2BtOeRJAvJfIOo71g',
  authDomain: 'underline-shop-rrjjyy.firebaseapp.com',
  projectId: 'underline-shop-rrjjyy',
  storageBucket: 'underline-shop-rrjjyy.firebasestorage.app',
  messagingSenderId: '384110852230',
  appId: '1:384110852230:web:7f45ccb8c227334f457907',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let cache;
try {
  cache = persistentLocalCache({ tabManager: persistentMultipleTabManager() });
} catch {
  cache = undefined;
}
export const db = initializeFirestore(app, cache ? { localCache: cache } : {});
