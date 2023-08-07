/**
 * @jest-environment jsdom
 */

import {getAllByTestId, getByTestId, screen, waitFor} from "@testing-library/dom"
import { toHaveClass, getByText } from '@testing-library/jest-dom'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills"
import {mockedBills} from "../__mocks__/store.js"
import mockStore from "../__mocks__/store"
import "bootstrap";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList[0]).toEqual('active-icon');

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })


    // Fonction handleClickNewBill
    describe("And when I click on the new bill button", () => {
      test('Then I should be redirected to the bill creation page', () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const onNavigate = () => {return}
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        const store = null;
        // Instanciation de l'objet Bills avec les données mockées
        const sampleBills = new Bills({document, onNavigate, store, bills, localStorage:window.localStorage});

        //Mock de la méthode handleClickNewBill
        sampleBills.handleClickNewBill = jest.fn()
        // Création d'un event listener appelant la méthode mcokée
        screen.getByTestId("btn-new-bill").addEventListener("click", sampleBills.handleClickNewBill)
        //Simulation d'un click de l'utilisateur
        screen.getByTestId("btn-new-bill").click()

        expect(sampleBills.handleClickNewBill).toBeCalled()
      })
    })

    // Fonction handleClickIconEye
    describe("And when I click on Eye icon", () => {
      test("Then a modal should open", async () => {

        document.body.innerHTML = BillsUI({ data: bills })
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        const store = null;

        // Instanciation de l'objet Bills avec les données mockées
        const BillsObject = new Bills({document, onNavigate, store, bills, localStorage:window.localStorage});

        // Récupération de toutes les icones eye
        const eyeIcons = screen.getAllByTestId('icon-eye');
        // Récupération de la modale 
        const modalFile = document.querySelector("#modaleFile");
        
        // Mock de la fonction handleClickIconEye
        const handleClickIconEye = jest.fn(BillsObject.handleClickIconEye);
        eyeIcons[0].addEventListener("click", () => handleClickIconEye(eyeIcons[0]));
        userEvent.click(eyeIcons[0]);

        // Timer permettant d'attendre que la modale apparaisse
        let i = 0;
        while (!modalFile.classList.contains("show") && i < 9) {
          await new Promise((r) => setTimeout(r, 500));
          if(!modalFile.classList.contains("show") && i < 9){
            console.log("modale pas affichée")
            i++;
          }
          if(!modalFile.classList.contains("show") && i >= 9){
            console.log("modale pas affichée et fin")
          }
          // if(i === 8){
          //   modalFile.classList.add('show')
          // }
          if(modalFile.classList.contains("show")){
            console.log("modale affichée")
            break;
          }
        }

      // expect(handleClickIconEye).toHaveBeenCalled();
      expect(modalFile).toHaveClass("show");
      })
    })
  });

  
})


// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "b@b" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      document.body.innerHTML = BillsUI({ data: bills });
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const contentPending = screen.getByText("pending");
      expect(contentPending).toBeTruthy();
      const contentAccepted = screen.getAllByText("accepted");
      expect(contentAccepted).toBeTruthy();
      expect(screen.getAllByTestId("icon-eye")).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "b@b",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

        const html = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = html;

        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        const html = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = html;

        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
