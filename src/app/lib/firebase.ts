// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBLQlyG5wMSuxXfep8AkkAQz73cuFD9B4",
  authDomain: "dtrsystem-d3416.firebaseapp.com",
  databaseURL: "https://dtrsystem-d3416-default-rtdb.firebaseio.com",
  projectId: "dtrsystem-d3416",
  storageBucket: "dtrsystem-d3416.firebasestorage.app",
  messagingSenderId: "747066428637",
  appId: "1:747066428637:web:4f3e0157facd5b98efdf34",
  measurementId: "G-BV2ZHGEY5D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);