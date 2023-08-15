/**
 * @jest-environment jsdom
 */

import {getAllByTestId, getByTestId, screen, waitFor, fireEvent} from "@testing-library/dom"
import '@testing-library/jest-dom'
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {getExtension, isImage} from "../containers/NewBill.js"
import mockStore from "../__mocks__/store";
import {localStorageMock} from "../__mocks__/localStorage.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    const jpgFile = "file.jpg"
    const jpegFile = "file.jpeg"
    const pngFile = "file.png"
    const otherFile = "file.other"

    test("Then it should get the file extension", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      //to-do write assertion
      expect(getExtension(jpgFile)).toEqual("jpg")
      expect(getExtension(jpegFile)).toEqual("jpeg")
      expect(getExtension(pngFile)).toEqual("png")
      expect(getExtension(otherFile)).toEqual("other")
    })
    test("Then it should verify if the file is an image", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
  
      expect(isImage(jpgFile)).toBeTruthy()
      expect(isImage(jpegFile)).toBeTruthy()
      expect(isImage(pngFile)).toBeTruthy()
      expect(isImage(otherFile)).toBeFalsy()
  
    })

    describe("When I upload a file", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      test("Then uploading an image should work", () => {
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        const mockFile = new File(["test.jpg"], "test.jpg", {type: 'image/jpg'})
        const fileInput = screen.getByTestId('file');
        jest.spyOn(window, "alert").mockImplementation(() => {});

        fileInput.addEventListener('change', handleChangeFile)

        userEvent.upload(fileInput, mockFile)

        expect(handleChangeFile).toHaveBeenCalled()
        expect(window.alert).not.toHaveBeenCalled()
        
      })

      test("Then selecting wrong files should display error message", async () => {
        jest.spyOn(window, "alert").mockImplementation(() => {});
        const fileInput = screen.getByTestId("file");

        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        fileInput.addEventListener("change", (e) => handleChangeFile(e));
        const mockFile = new File(["test"], "test.gif", { type: "image/gif" });
        userEvent.upload(fileInput, mockFile);
        expect(handleChangeFile).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
      });
    })
  }) 
})

//Test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I submit the form completed", () => {
    test("Then the bill is created", async () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const mockBill = {
        type: "Transports",
        name: "Vol Paris Bangkok",
        date: "2022-08-08",
        amount: 300,
        vat: 80,
        pct: 20,
        commentary: "Comment",
        fileUrl: "../img/test.png",
        fileName: "test.png",
        status: "pending",
      };

      // Load the values in the form
      screen.getByTestId("expense-type").value = mockBill.type;
      screen.getByTestId("expense-name").value = mockBill.name;
      screen.getByTestId("datepicker").value = mockBill.date;
      screen.getByTestId("amount").value = mockBill.amount;
      screen.getByTestId("vat").value = mockBill.vat;
      screen.getByTestId("pct").value = mockBill.pct;
      screen.getByTestId("commentary").value = mockBill.commentary;

      newBill.fileName = mockBill.fileName;
      newBill.fileUrl = mockBill.fileUrl;

      newBill.updateBill = jest.fn();
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(newBill.updateBill).toHaveBeenCalled();
    });

    describe("When an error occurs on API", () => {
      test("fetches error from an API and fails with 500 error", async () => {
        jest.spyOn(mockStore, "bills");
        jest.spyOn(console, "error").mockImplementation(() => {}); // Prevent jest error

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        Object.defineProperty(window, "location", {
          value: { hash: ROUTES_PATH["NewBill"] },
        });

        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );
        document.body.innerHTML = `<div id="root"></div>`;
        router();

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        mockStore.bills.mockImplementationOnce(() => {
          return {
            update: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Submit form
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);
        await new Promise(process.nextTick);
        expect(console.error).toHaveBeenCalled();
      });
    });
  });
});

