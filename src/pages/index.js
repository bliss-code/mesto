import {Card} from '../components/Card.js';
import {initialCards, config} from '../utils/constants.js';
import Section from '../components/Section.js';
import PopupWithImage from '../components/PopupWithImage.js';
import PopupWithForm from '../components/PopupWithForm.js';
import FormValidator from '../components/FormValidator.js';
import UserInfo from '../components/UserInfo.js';
import './index.css';
import Api from '../components/Api.js';

/**
 * Event listener handler for card photo
 */
function handleCardClick (popup) {
  return function (photoAttributes, placeNameText) {
           return () => {popup.open(photoAttributes, placeNameText)}
         }
};

/**
 * Adds a new place card to a section
 * @param {Object} cardData - {name: "", link: ""}
 * @param {Section} destinationSection
 */
function addPlaceCard(cardData, destinationSection) {
  cardData.templateSelector = config.cardTemplateSelector;
  cardData.handleCardClick = handleCardClick(photoPopup);
  const placeCard = new Card(cardData);
  destinationSection.addItem(placeCard.generateCard());
}

const photoPopup = new PopupWithImage(config.photoPopupTemplateSelector);

//display initial cards
const placesList = new Section({
  items: initialCards,
  renderer: (item) => addPlaceCard(item, placesList)
}, `.${config.placesList}`);

placesList.renderItems();

/**
 * Creates a form submit handler with a given callback
 * @param {Function} callback - runs inside of the handler
 * @returns {formSubmitHandler}
 */
function makeFormSubmitHandler(callback) {
  /**
   * Creates a form submit handler with the given form data
   * @param {Object} formData - {property1: "value1", property2: "value2"}
   * @returns
   */
  const handler = function formSubmitHandler (formData) {
    return function (evt) {
      evt.preventDefault();
      callback(formData);
      this.close();
    }
  }
  return handler;
}

const profileAddSubmitHandler = makeFormSubmitHandler(
  (formData) => addPlaceCard({ name: formData[config.placeInputNameName], link: formData[config.placeInputUrlName] }, placesList)
);

/**
 * Creates enabled form validator for a given form
 * @param {HTMLElement} form
 * @returns {FormValidator}
 */
function makeEnabledValidator(form) {
  const validator = new FormValidator(config, form);
  validator.enableValidation();
  return validator;
}

const profileAddPopup = new PopupWithForm({
  popupSelector: config.profileAddPopupTemplateSelector,
  formSubmitCallback: profileAddSubmitHandler });

const profileAddPopupValidator = makeEnabledValidator(profileAddPopup.getForm());

const profileAddButton = document.querySelector(config.profileAddButtonSelector);
profileAddButton.addEventListener('click',
 () => profileAddPopup.open(
   () => profileAddPopupValidator.clearFormValidation()
  )
);

//prepare api object for use
const api = new Api({
  baseUrl: 'https://mesto.nomoreparties.co/v1/cohort-25/',
  headers: {
    authorization: 'd8d84bac-32d7-42f9-a622-bbe14f1aa9f5',
    'Content-Type': 'application/json'
  }
});

//set up profile info logic

api.getUserInfo()
  .then(info => {
    const profileInfo = new UserInfo(config.profileNameSelector, config.profileDescriptionSelector);

    profileInfo.setUserInfo({ name: info.name, description: info.about });

    const profileEditSubmitHandler = makeFormSubmitHandler(
      (formData) => {
        api.setUserInfo({ name: formData[config.profileInputNameName], about: formData[config.profileInputDescriptionName] })
        .then(info => {
          profileInfo.setUserInfo({ name: formData[config.profileInputNameName], description: formData[config.profileInputDescriptionName] });
        })
        .catch(err => console.log(err));
      }
    );

    const profileEditPopup = new PopupWithForm({
      popupSelector: config.profileEditPopupTemplateSelector,
      formSubmitCallback: profileEditSubmitHandler });

    const profileEditPopupValidator = makeEnabledValidator(profileEditPopup.getForm());
    const profileEditButton = document.querySelector('.profile__edit-button');
    profileEditButton.addEventListener('click',
      () => profileEditPopup.open(
        () => {
          profileEditPopupValidator.clearFormValidation();
          profileEditPopup.setInputValues(profileInfo.getUserInfo());
        }
      )
    );
  })
  .catch(err => console.log(err));



